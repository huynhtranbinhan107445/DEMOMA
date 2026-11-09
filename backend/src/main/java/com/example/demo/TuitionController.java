package com.example.demo;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController @RequestMapping("/api/tuition")
public class TuitionController {
 private final TuitionRepository repo;private final StudentRepository students;
 public TuitionController(TuitionRepository repo,StudentRepository students){this.repo=repo;this.students=students;}
 @GetMapping public List<Tuition> all(Authentication auth){
  if(!isAdmin(auth))return repo.findAll().stream().filter(x->studentId(auth).equalsIgnoreCase(x.getMaSV())).toList();return repo.findAll();}
 @PostMapping public ResponseEntity<?> create(@RequestBody Tuition x){
  if(x.getMaSV()==null||students.findByMaSVIgnoreCase(x.getMaSV()).isEmpty()||x.getSemester()==null||x.getSemester().isBlank()||x.getAmount()==null||x.getAmount()<0||x.getPaidAmount()==null||x.getPaidAmount()<0||x.getPaidAmount()>x.getAmount())return ResponseEntity.badRequest().body("Dữ liệu học phí không hợp lệ");
  x.setStatus(x.getPaidAmount().equals(x.getAmount())?"PAID":x.getPaidAmount()>0?"PARTIAL":"UNPAID");
  x.setId(null);return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(x));
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody Tuition x){
  if(!repo.existsById(id))return ResponseEntity.notFound().build();
  if(x.getMaSV()==null||students.findByMaSVIgnoreCase(x.getMaSV()).isEmpty()||x.getSemester()==null||x.getSemester().isBlank()||x.getAmount()==null||x.getAmount()<0||x.getPaidAmount()==null||x.getPaidAmount()<0||x.getPaidAmount()>x.getAmount())return ResponseEntity.badRequest().body("Dữ liệu học phí không hợp lệ");
  x.setStatus(x.getPaidAmount().equals(x.getAmount())?"PAID":x.getPaidAmount()>0?"PARTIAL":"UNPAID");
  x.setId(id);return ResponseEntity.ok(repo.save(x));
 }
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id){if(!repo.existsById(id))return ResponseEntity.notFound().build();repo.deleteById(id);return ResponseEntity.noContent().build();}
 
 private boolean isAdmin(Authentication a){return a.getAuthorities().stream().anyMatch(v->v.getAuthority().equals("ROLE_ADMIN"));}
 private String studentId(Authentication a){return students.findByEmail(a.getName()).map(Student::getMaSV).orElse("");}

}
