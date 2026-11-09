package com.example.demo;

import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/lecturers")
public class LecturerController {
 private final LecturerRepository repo;
 private final CourseRepository courses;
 private final ScheduleRepository schedules;
 private final StudentRepository students;
 private final PasswordEncoder encoder;
 public LecturerController(LecturerRepository repo,CourseRepository courses,ScheduleRepository schedules,StudentRepository students,PasswordEncoder encoder){
  this.repo=repo;this.courses=courses;this.schedules=schedules;this.students=students;this.encoder=encoder;
 }
 public record LecturerView(String id,String code,String fullName,String email,String department,Long payPerCredit,boolean loginEnabled) {}
 public record LecturerPayload(String code,String fullName,String email,String department,String password,Long payPerCredit) {}
 private LecturerView view(Lecturer x,boolean admin){return new LecturerView(x.getId(),x.getCode(),x.getFullName(),x.getEmail(),x.getDepartment(),admin?x.getPayPerCredit():null,x.getPassword()!=null&&x.getPassword().startsWith("$2"));}
 private boolean admin(Authentication auth){return auth.getAuthorities().stream().anyMatch(a->"ROLE_ADMIN".equals(a.getAuthority()));}
 @GetMapping public List<LecturerView> all(Authentication auth){boolean isAdmin=admin(auth);return repo.findAll().stream().map(x->view(x,isAdmin)).toList();}
 @GetMapping("/me") public ResponseEntity<?> me(Authentication auth){
  return repo.findByEmailIgnoreCase(auth.getName()).<ResponseEntity<?>>map(x->ResponseEntity.ok(view(x,false))).orElseGet(()->ResponseEntity.notFound().build());
 }
 @PostMapping public ResponseEntity<?> create(@RequestBody LecturerPayload x){
  String error=validate(x,true);if(error!=null)return ResponseEntity.badRequest().body(error);
  Lecturer lecturer=new Lecturer();assign(lecturer,x,true);
  return ResponseEntity.status(HttpStatus.CREATED).body(view(repo.save(lecturer),true));
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody LecturerPayload x){
  Lecturer lecturer=repo.findById(id).orElse(null);if(lecturer==null)return ResponseEntity.notFound().build();
  String error=validate(x,false);if(error!=null)return ResponseEntity.badRequest().body(error);
  Optional<Lecturer> duplicateEmail=repo.findByEmailIgnoreCase(x.email().trim());
  if(duplicateEmail.isPresent()&&!duplicateEmail.get().getId().equals(id))return ResponseEntity.status(409).body("Email đã thuộc về giảng viên khác");
  Optional<Lecturer> duplicateCode=repo.findByCodeIgnoreCase(x.code().trim());
  if(duplicateCode.isPresent()&&!duplicateCode.get().getId().equals(id))return ResponseEntity.status(409).body("Mã giảng viên đã tồn tại");
  if(students.existsByEmailIgnoreCase(x.email().trim()))return ResponseEntity.status(409).body("Email đã thuộc về sinh viên");
  String oldName=lecturer.getFullName();
  assign(lecturer,x,false);
  Lecturer saved=repo.save(lecturer);
  if(!Objects.equals(oldName,saved.getFullName())){
   for(Schedule schedule:schedules.findAll()){
    if(id.equals(schedule.getLecturerId())){
     schedule.setGiangVien(saved.getFullName());schedules.save(schedule);
    }
   }
  }
  return ResponseEntity.ok(view(saved,true));
 }
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id){
  if(!repo.existsById(id))return ResponseEntity.notFound().build();
  if(courses.findAll().stream().anyMatch(c->id.equals(c.getLecturerId())))return ResponseEntity.status(409).body("Giảng viên đang được phân công học phần. Hãy chuyển phân công trước khi xóa.");
  repo.deleteById(id);return ResponseEntity.noContent().build();
 }
 private String validate(LecturerPayload x,boolean creating){
  if(x==null||blank(x.code())||blank(x.fullName())||blank(x.email())||blank(x.department()))return "Nhập đủ mã, họ tên, email và khoa";
  String email=x.email().trim();if(!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))return "Email không hợp lệ";
  if(x.payPerCredit()==null||x.payPerCredit()<0||x.payPerCredit()>1_000_000_000L)return "Đơn giá giảng dạy phải từ 0 đến 1.000.000.000 VND/tín chỉ";
  if(creating&&(blank(x.password())||x.password().length()<10))return "Mật khẩu ban đầu tối thiểu 10 ký tự";
  if(!blank(x.password())&&x.password().length()<10)return "Mật khẩu mới tối thiểu 10 ký tự";
  Optional<Lecturer> byCode=repo.findByCodeIgnoreCase(x.code().trim());
  Optional<Lecturer> byEmail=repo.findByEmailIgnoreCase(email);
  if(creating&&(byCode.isPresent()||byEmail.isPresent()||students.existsByEmailIgnoreCase(email)))return "Mã hoặc email đã tồn tại";
  return null;
 }
 private boolean blank(String x){return x==null||x.isBlank();}
 private void assign(Lecturer x,LecturerPayload data,boolean creating){
  x.setCode(data.code().trim());x.setFullName(data.fullName().trim());x.setEmail(data.email().trim().toLowerCase(Locale.ROOT));x.setDepartment(data.department().trim());
  x.setPayPerCredit(data.payPerCredit());
  if(!blank(data.password()))x.setPassword(encoder.encode(data.password()));
 }
}
