package com.example.demo;

import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
 private final CourseRepository repo;
 private final LecturerRepository lecturers;
 private final ScheduleRepository schedules;
 private final EnrollmentRepository enrollments;
 private final TeachingTaskRepository tasks;
 private final FacultyRepository faculties;
 public CourseController(CourseRepository repo,LecturerRepository lecturers,ScheduleRepository schedules,EnrollmentRepository enrollments,TeachingTaskRepository tasks,FacultyRepository faculties){
  this.repo=repo;this.lecturers=lecturers;this.schedules=schedules;this.enrollments=enrollments;this.tasks=tasks;this.faculties=faculties;
 }
 @GetMapping public List<Course> all(Authentication auth){
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null)return List.of();
   return repo.findAll().stream().filter(c->isAssigned(c,me.getId())).toList();
  }
  return repo.findAll();
 }
 @GetMapping("/{id}") public ResponseEntity<Course> one(@PathVariable String id,Authentication auth){
  Course course=repo.findById(id).orElse(null);
  if(course==null)return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null||!isAssigned(course,me.getId()))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  }
  return ResponseEntity.ok(course);
 }
 @PostMapping public ResponseEntity<?> create(@RequestBody Course c,Authentication auth){
  if(invalid(c))return ResponseEntity.badRequest().body("Cần mã môn, tên môn và số tín chỉ từ 1 đến 10");
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null)return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không xác định được giảng viên");
   c.setLecturerId(me.getId()); // Giảng viên không thể tạo môn cho người khác.
  }else if(!hasRole(auth,"ADMIN"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  if(!validLecturer(c))return ResponseEntity.badRequest().body("Hãy chọn giảng viên có trong danh sách");
  if(!validFaculty(c))return ResponseEntity.badRequest().body("Hãy chọn khoa có trong danh sách Khoa & Lớp");
  c.setDepartment(c.getDepartment().trim().toUpperCase(Locale.ROOT));
  c.setCode(c.getCode().trim());c.setName(c.getName().trim());
  if(repo.findByCodeIgnoreCase(c.getCode()).isPresent())return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã môn đã tồn tại");
  c.setId(null);return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(c));
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody Course c,Authentication auth){
  Course previous=repo.findById(id).orElse(null);
  if(previous==null)return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   // Giảng viên chỉ sửa học phần mà mình là người phụ trách chính.
   if(me==null||!me.getId().equals(previous.getLecturerId()))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ sửa học phần mình phụ trách");
   c.setLecturerId(me.getId());
  }else if(!hasRole(auth,"ADMIN"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  if(invalid(c))return ResponseEntity.badRequest().body("Dữ liệu học phần không hợp lệ");
  if(!validLecturer(c))return ResponseEntity.badRequest().body("Hãy chọn giảng viên có trong danh sách");
  if(!validFaculty(c))return ResponseEntity.badRequest().body("Hãy chọn khoa có trong danh sách Khoa & Lớp");
  c.setDepartment(c.getDepartment().trim().toUpperCase(Locale.ROOT));
  c.setCode(c.getCode().trim());c.setName(c.getName().trim());
  Optional<Course> duplicate=repo.findByCodeIgnoreCase(c.getCode());
  if(duplicate.isPresent()&&!id.equals(duplicate.get().getId()))return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã môn đã tồn tại");
  if(!Objects.equals(previous.getCredits(),c.getCredits())&&schedules.findAll().stream()
     .anyMatch(row->id.equals(row.getCourseId())&&row.getPlanId()!=null&&!row.getPlanId().isBlank()))
   return ResponseEntity.status(HttpStatus.CONFLICT).body("Học phần đã có kế hoạch lịch tự động. Hãy xóa kế hoạch cũ trước khi đổi số tín chỉ.");
  c.setId(id);
  Course saved=repo.save(c);
  Lecturer teacher=lecturers.findById(c.getLecturerId()).orElseThrow();
  for(Schedule s:schedules.findAll()){
   if(id.equals(s.getCourseId())||(s.getCourseId()==null&&previous.getName().trim().equalsIgnoreCase(s.getTenMonHoc()==null?"":s.getTenMonHoc().trim()))){
    s.setCourseId(id);s.setTenMonHoc(saved.getName());
    if(s.getLecturerId()==null||s.getLecturerId().isBlank()){
     s.setLecturerId(teacher.getId());s.setGiangVien(teacher.getFullName());
    }
    schedules.save(s);
   }
  }
  return ResponseEntity.ok(saved);
 }
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id,Authentication auth){
  Course c=repo.findById(id).orElse(null);
  if(c==null)return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null||!me.getId().equals(c.getLecturerId()))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền xóa học phần này");
  }else if(!hasRole(auth,"ADMIN"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  if(schedules.findAll().stream().anyMatch(s->id.equals(s.getCourseId()))||enrollments.findAll().stream().anyMatch(e->id.equals(e.getCourseId()))||tasks.findAll().stream().anyMatch(t->id.equals(t.getCourseId())))
   return ResponseEntity.status(HttpStatus.CONFLICT).body("Học phần đã có lịch học, công việc hoặc sinh viên đăng ký, không thể xóa");
  repo.deleteById(id);return ResponseEntity.noContent().build();
 }
 private boolean isAssigned(Course c,String lecturerId){
  return lecturerId.equals(c.getLecturerId())||schedules.findAll().stream().anyMatch(s->lecturerId.equals(s.getLecturerId())&&c.getId().equals(s.getCourseId()));
 }
 private Lecturer currentLecturer(Authentication auth){return lecturers.findByEmailIgnoreCase(auth.getName()).orElse(null);}
 private boolean hasRole(Authentication auth,String role){return auth!=null&&auth.getAuthorities().stream().anyMatch(a->("ROLE_"+role).equals(a.getAuthority()));}
 private boolean validLecturer(Course c){return c.getLecturerId()!=null&&!c.getLecturerId().isBlank()&&lecturers.existsById(c.getLecturerId());}
 private boolean validFaculty(Course c){return c.getDepartment()!=null&&faculties.findByCodeIgnoreCase(c.getDepartment().trim()).isPresent();}
 private boolean invalid(Course c){return c==null||c.getCode()==null||c.getCode().isBlank()||c.getName()==null||c.getName().isBlank()||c.getCredits()==null||c.getCredits()<1||c.getCredits()>10;}
}
