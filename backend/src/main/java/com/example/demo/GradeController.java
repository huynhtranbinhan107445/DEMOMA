package com.example.demo;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/grades")
public class GradeController {
 private final GradeRepository grades; private final StudentRepository students; private final CourseRepository courses;
 public GradeController(GradeRepository grades,StudentRepository students,CourseRepository courses){this.grades=grades;this.students=students;this.courses=courses;}
 @GetMapping public List<Grade> list(@RequestParam(required=false) String maSV,org.springframework.security.core.Authentication auth){
  if(auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_ADMIN")))return grades.findByMaSVIgnoreCase(students.findByEmail(auth.getName()).map(Student::getMaSV).orElse(""));return maSV==null||maSV.isBlank()?grades.findAll():grades.findByMaSVIgnoreCase(maSV);}
 @PostMapping public ResponseEntity<?> save(@RequestBody Grade g){
  if(g.getMaSV()==null||students.findByMaSVIgnoreCase(g.getMaSV()).isEmpty())return ResponseEntity.badRequest().body("Sinh viên không tồn tại");
  if(g.getCourseId()==null||!courses.existsById(g.getCourseId()))return ResponseEntity.badRequest().body("Học phần không tồn tại");
  if(!valid(g.getProcessScore())||!valid(g.getExamScore()))return ResponseEntity.badRequest().body("Điểm phải từ 0 đến 10");
  if(g.getId()==null||g.getId().isBlank()) {
   boolean duplicate=grades.findByMaSVIgnoreCase(g.getMaSV()).stream().anyMatch(x->g.getCourseId().equals(x.getCourseId()));
   if(duplicate)return ResponseEntity.status(HttpStatus.CONFLICT).body("Đã có điểm cho học phần này");
  } else if(!grades.existsById(g.getId()))return ResponseEntity.notFound().build();
  return ResponseEntity.ok(grades.save(g));
 }
 private boolean valid(Double d){return d!=null&&Double.isFinite(d)&&d>=0&&d<=10;}
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id){if(!grades.existsById(id))return ResponseEntity.notFound().build();grades.deleteById(id);return ResponseEntity.noContent().build();}
}
