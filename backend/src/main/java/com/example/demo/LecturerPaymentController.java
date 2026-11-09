package com.example.demo;

import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/lecturer-payments")
public class LecturerPaymentController {
 private final LecturerRepository lecturers;
 private final CourseRepository courses;
 private final ScheduleRepository schedules;
 public LecturerPaymentController(LecturerRepository lecturers,CourseRepository courses,ScheduleRepository schedules){this.lecturers=lecturers;this.courses=courses;this.schedules=schedules;}
 public record TeachingLine(String courseId,String courseCode,String courseName,String semester,int credits,int classCount,List<String> classes,long unitPrice,long amount) {}
 public record TeachingPayment(String lecturerId,String lecturerCode,String lecturerName,long unitPrice,long totalClasses,long totalCredits,long totalAmount,List<TeachingLine> details) {}
 @GetMapping public ResponseEntity<?> get(Authentication auth){
  boolean admin=auth.getAuthorities().stream().anyMatch(a->"ROLE_ADMIN".equals(a.getAuthority()));
  List<Lecturer> teachers;
  if(admin)teachers=lecturers.findAll();
  else {
   Lecturer teacher=lecturers.findByEmailIgnoreCase(auth.getName()).orElse(null);
   if(teacher==null)return ResponseEntity.status(403).body("Không tìm thấy giảng viên");
   teachers=List.of(teacher);
  }
  List<Course> allCourses=courses.findAll();
  List<Schedule> allSchedules=schedules.findAll();
  List<TeachingPayment> result=new ArrayList<>();
  for(Lecturer teacher:teachers){
   long rate=teacher.getPayPerCredit()==null?0:teacher.getPayPerCredit();
   long totalClasses=0,totalCredits=0,totalAmount=0;
   List<TeachingLine> details=new ArrayList<>();
   for(Course c:allCourses){
    boolean defaultAssigned=teacher.getId().equals(c.getLecturerId());
    boolean assignedInSchedule=allSchedules.stream().anyMatch(s->c.getId().equals(s.getCourseId())&&teacher.getId().equals(s.getLecturerId()));
    if(!defaultAssigned&&!assignedInSchedule)continue;
    Set<String> classKeys=new LinkedHashSet<>();
    Map<String,String> display=new LinkedHashMap<>();
    for(Schedule s:allSchedules){
     boolean sameCourse=c.getId().equals(s.getCourseId())
      ||(blank(s.getCourseId())&&normalized(c.getName()).equals(normalized(s.getTenMonHoc())));
     boolean sameTeacher=teacher.getId().equals(s.getLecturerId())
      ||(blank(s.getLecturerId())&&normalized(teacher.getFullName()).equals(normalized(s.getGiangVien())));
     if(sameCourse&&sameTeacher&&!blank(s.getLop())){
      String key=normalized(s.getLop());classKeys.add(key);display.putIfAbsent(key,s.getLop().trim());
     }
    }
    int credits=c.getCredits()==null?0:c.getCredits();
    long count=classKeys.size();
    long amount=Math.multiplyExact(Math.multiplyExact(rate,credits),count);
    details.add(new TeachingLine(c.getId(),c.getCode(),c.getName(),c.getSemester(),credits,(int)count,new ArrayList<>(display.values()),rate,amount));
    totalClasses+=count;totalCredits+=credits*count;totalAmount+=amount;
   }
   result.add(new TeachingPayment(teacher.getId(),teacher.getCode(),teacher.getFullName(),rate,totalClasses,totalCredits,totalAmount,details));
  }
  return ResponseEntity.ok(result);
 }
 private boolean blank(String s){return s==null||s.isBlank();}
 private String normalized(String s){return s==null?"":s.replace('\u00a0',' ').trim().replaceAll("\\s+"," ").toLowerCase(Locale.ROOT);}
}
