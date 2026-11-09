package com.example.demo;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {
 private final EnrollmentRepository repo;
 private final StudentRepository students;
 private final CourseRepository courses;
 private final CreditPriceRepository prices;
 public EnrollmentController(EnrollmentRepository repo, StudentRepository students, CourseRepository courses, CreditPriceRepository prices){
  this.repo=repo;this.students=students;this.courses=courses;this.prices=prices;
 }
 @GetMapping
 public List<Enrollment> all(@RequestParam(required=false) String maSV,org.springframework.security.core.Authentication auth) {
  if(!isAdmin(auth))return repo.findByMaSVIgnoreCase(studentId(auth));
  return maSV==null||maSV.isBlank()?repo.findAll():repo.findByMaSVIgnoreCase(maSV.trim());
 }
 @PostMapping
 public ResponseEntity<?> create(@RequestBody Enrollment enrollment,org.springframework.security.core.Authentication auth){
  if(enrollment==null||enrollment.getMaSV()==null||enrollment.getMaSV().isBlank()||enrollment.getCourseId()==null||enrollment.getCourseId().isBlank())
   return ResponseEntity.badRequest().body("Thiếu mã sinh viên hoặc học phần");
  if(!isAdmin(auth)&&!studentId(auth).equalsIgnoreCase(enrollment.getMaSV()))return ResponseEntity.status(403).body("Không thể đăng ký thay sinh viên khác");
  String maSV=enrollment.getMaSV().trim();
  if(students.findByMaSVIgnoreCase(maSV).isEmpty())return ResponseEntity.badRequest().body("Sinh viên không tồn tại");
  Optional<Course> course=courses.findById(enrollment.getCourseId());
  if(course.isEmpty())return ResponseEntity.badRequest().body("Học phần không tồn tại");
  if(repo.existsByMaSVIgnoreCaseAndCourseId(maSV,enrollment.getCourseId()))
   return ResponseEntity.status(HttpStatus.CONFLICT).body("Sinh viên đã đăng ký học phần này");
  Long unitPrice=prices.findById("default").map(CreditPriceSetting::getPricePerCredit).orElse(null);
  if(unitPrice==null||unitPrice<=0)return ResponseEntity.status(409).body("Admin chưa thiết lập đơn giá tín chỉ. Chưa thể đăng ký học phần.");
  Integer credits=course.get().getCredits();
  if(credits==null||credits<=0)return ResponseEntity.badRequest().body("Học phần chưa có số tín chỉ hợp lệ");
  enrollment.setCreditsAtRegistration(credits);
  enrollment.setUnitPrice(unitPrice);
  enrollment.setTuitionAmount(Math.multiplyExact(unitPrice,credits.longValue()));
  enrollment.setId(null);
  enrollment.setMaSV(maSV);
  enrollment.setSemester(course.get().getSemester());
  return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(enrollment));
 }
 @DeleteMapping("/{id}")
 public ResponseEntity<Void> delete(@PathVariable String id,org.springframework.security.core.Authentication auth){
  if(!isAdmin(auth)&&repo.findById(id).filter(e->studentId(auth).equalsIgnoreCase(e.getMaSV())).isEmpty())return ResponseEntity.status(403).build();
  if(!repo.existsById(id))return ResponseEntity.notFound().build();
  repo.deleteById(id);return ResponseEntity.noContent().build();
 }
 private boolean isAdmin(org.springframework.security.core.Authentication auth) {
  return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
 }
 private String studentId(org.springframework.security.core.Authentication auth) {
  return students.findByEmail(auth.getName()).map(Student::getMaSV).orElse("");
 }
}
