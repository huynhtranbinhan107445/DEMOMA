package com.example.demo;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController @RequestMapping("/api/exams")
public class ExamController {
 private final ExamRepository repo; private final CourseRepository courses; private final EnrollmentRepository enrollments; private final StudentRepository students;
 public ExamController(ExamRepository repo,CourseRepository courses,EnrollmentRepository enrollments,StudentRepository students){this.repo=repo;this.courses=courses;this.enrollments=enrollments;this.students=students;}
 @GetMapping public List<Exam> all(Authentication auth){
  if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN")))return repo.findAll();
  String maSV=students.findByEmail(auth.getName()).map(Student::getMaSV).orElse("");
  Set<String> ids=new HashSet<>();for(Enrollment e:enrollments.findByMaSVIgnoreCase(maSV))ids.add(e.getCourseId());
  return repo.findAll().stream().filter(e->ids.contains(e.getCourseId())).toList();
 }
 @PostMapping public ResponseEntity<?> create(@RequestBody Exam x){
  if(x.getCourseId()==null||!courses.existsById(x.getCourseId())||x.getDate()==null||x.getStartTime()==null||x.getRoom()==null)return ResponseEntity.badRequest().body("Thông tin lịch thi không hợp lệ");
  try { java.time.LocalDate.parse(x.getDate());java.time.LocalTime.parse(x.getStartTime()); }catch(Exception ex){return ResponseEntity.badRequest().body("Ngày YYYY-MM-DD, giờ HH:mm");}
  x.setId(null);return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(x));
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody Exam x){
  if(!repo.existsById(id))return ResponseEntity.notFound().build();
  if(x.getCourseId()==null||!courses.existsById(x.getCourseId())||x.getDate()==null||x.getStartTime()==null||x.getRoom()==null)return ResponseEntity.badRequest().body("Thông tin lịch thi không hợp lệ");
  try { java.time.LocalDate.parse(x.getDate());java.time.LocalTime.parse(x.getStartTime()); }catch(Exception ex){return ResponseEntity.badRequest().body("Ngày YYYY-MM-DD, giờ HH:mm");}
  x.setId(id);return ResponseEntity.ok(repo.save(x));
 }
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id){if(!repo.existsById(id))return ResponseEntity.notFound().build();repo.deleteById(id);return ResponseEntity.noContent().build();}
 
}
