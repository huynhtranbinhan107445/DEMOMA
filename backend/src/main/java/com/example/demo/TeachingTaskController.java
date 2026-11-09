package com.example.demo;

import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teaching-tasks")
public class TeachingTaskController {
 private final TeachingTaskRepository tasks;
 private final LecturerRepository lecturers;
 private final CourseRepository courses;
 public TeachingTaskController(TeachingTaskRepository tasks,LecturerRepository lecturers,CourseRepository courses){
  this.tasks=tasks;this.lecturers=lecturers;this.courses=courses;
 }
 @GetMapping public List<TeachingTask> all(Authentication auth){
  if(isAdmin(auth))return tasks.findAll();
  Lecturer me=currentLecturer(auth);
  if(me==null)return List.of();
  return tasks.findAll().stream().filter(t->me.getId().equals(t.getOwnerLecturerId())).toList();
 }
 @PostMapping public ResponseEntity<?> create(@RequestBody TeachingTask request,Authentication auth){
  String err=validate(request,auth);if(err!=null)return ResponseEntity.badRequest().body(err);
  request.setId(null);request.setCompleted(false);
  request.setCreatedBy(auth.getName());
  String now=Instant.now().toString();request.setCreatedAt(now);request.setUpdatedAt(now);
  return ResponseEntity.status(HttpStatus.CREATED).body(tasks.save(request));
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody TeachingTask request,Authentication auth){
  TeachingTask previous=tasks.findById(id).orElse(null);
  if(previous==null)return ResponseEntity.notFound().build();
  if(!allowed(previous,auth))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền sửa công việc này");
  String err=validate(request,auth);if(err!=null)return ResponseEntity.badRequest().body(err);
  request.setId(id);request.setCreatedAt(previous.getCreatedAt());request.setCreatedBy(previous.getCreatedBy());
  request.setUpdatedAt(Instant.now().toString());
  return ResponseEntity.ok(tasks.save(request));
 }
 @PatchMapping("/{id}/toggle") public ResponseEntity<?> toggle(@PathVariable String id,Authentication auth){
  TeachingTask t=tasks.findById(id).orElse(null);
  if(t==null)return ResponseEntity.notFound().build();
  if(!allowed(t,auth))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền cập nhật công việc này");
  t.setCompleted(!t.isCompleted());t.setUpdatedAt(Instant.now().toString());
  return ResponseEntity.ok(tasks.save(t));
 }
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id,Authentication auth){
  TeachingTask t=tasks.findById(id).orElse(null);
  if(t==null)return ResponseEntity.notFound().build();
  if(!allowed(t,auth))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền xóa công việc này");
  tasks.deleteById(id);return ResponseEntity.noContent().build();
 }
 private String validate(TeachingTask t,Authentication auth){
  if(t==null)return "Thiếu thông tin công việc";
  String title=trim(t.getTitle()), desc=trim(t.getDescription()), date=trim(t.getDueDate());
  if(title.isEmpty()||title.length()>160)return "Tiêu đề phải có 1–160 ký tự";
  if(desc.length()>2000)return "Mô tả tối đa 2000 ký tự";
  try{LocalDate.parse(date);}catch(DateTimeParseException ex){return "Ngày thực hiện phải là YYYY-MM-DD";}
  String courseId=trim(t.getCourseId());
  if(!courseId.isEmpty()&&!courses.existsById(courseId))return "Học phần không tồn tại";
  String owner=trim(t.getOwnerLecturerId());
  if(isAdmin(auth)){
   if(!owner.isEmpty()&&!lecturers.existsById(owner))return "Giảng viên được giao không tồn tại";
  }else{
   Lecturer me=currentLecturer(auth);
   if(me==null)return "Không xác định được giảng viên";
   owner=me.getId(); // Không cho giảng viên gán nhiệm vụ cho người khác.
   // Nhiệm vụ do Admin giao có thể tham chiếu một học phần khác;
   // quyền xem/sửa vẫn chỉ thuộc chủ nhiệm vụ.
  }
  if(trim(t.getClassName()).length()>80)return "Tên lớp quá dài";
  t.setTitle(title);t.setDescription(desc);t.setDueDate(date);t.setCourseId(courseId);
  t.setClassName(trim(t.getClassName()));t.setOwnerLecturerId(owner);
  return null;
 }
 private boolean allowed(TeachingTask t,Authentication auth){
  if(isAdmin(auth))return true;
  Lecturer me=currentLecturer(auth);
  return me!=null&&me.getId().equals(t.getOwnerLecturerId());
 }
 private boolean isAdmin(Authentication auth){return auth!=null&&auth.getAuthorities().stream().anyMatch(a->"ROLE_ADMIN".equals(a.getAuthority()));}
 private Lecturer currentLecturer(Authentication auth){return auth==null?null:lecturers.findByEmailIgnoreCase(auth.getName()).orElse(null);}
 private String trim(String s){return s==null?"":s.trim();}
}
