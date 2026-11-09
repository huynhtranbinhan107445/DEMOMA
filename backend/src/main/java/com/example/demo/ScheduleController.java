package com.example.demo;

import java.util.*;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {
 private final ScheduleRepository repo;
 private final StudentRepository students;
 private final LecturerRepository lecturers;
 private final CourseRepository courses;
 private final AcademicClassRepository academicClasses;
 public ScheduleController(ScheduleRepository repo,StudentRepository students,LecturerRepository lecturers,CourseRepository courses,AcademicClassRepository academicClasses){
  this.repo=repo;this.students=students;this.lecturers=lecturers;this.courses=courses;this.academicClasses=academicClasses;
 }
 @GetMapping public List<Schedule> all(Authentication auth){
  if(hasRole(auth,"ADMIN"))return repo.findAll();
  if(hasRole(auth,"LECTURER")){
   Lecturer lecturer=currentLecturer(auth);
   if(lecturer==null)return List.of();
   return repo.findAll().stream().filter(s->ownedBy(s,lecturer)).toList();
  }
  return students.findByEmail(auth.getName()).map(st->byClass(st.getLop())).orElseGet(List::of);
 }
 @GetMapping("/class/{lop}") public List<Schedule> byClassEndpoint(@PathVariable String lop,Authentication auth){
  if(hasRole(auth,"ADMIN"))return byClass(lop);
  if(hasRole(auth,"LECTURER"))return all(auth).stream().filter(s->normalize(lop).equals(normalize(s.getLop()))).toList();
  return students.findByEmail(auth.getName()).filter(st->!normalize(st.getLop()).isEmpty()&&normalize(st.getLop()).equals(normalize(lop))).map(st->byClass(lop)).orElseGet(List::of);
 }
 @PostMapping public ResponseEntity<?> create(@RequestBody Schedule s,Authentication auth){
  String error=validate(s,auth,null);if(error!=null)return ResponseEntity.badRequest().body(error);
  s.setId(null);return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(s));
 }
 /** Update a manually created lesson for multiple classes in one request.
  * Every class gets its own row so student calendars and payroll remain correct.
  * Existing rows from the same manual group are replaced together.
  */
 public record MultiClassUpdateRequest(Schedule schedule,List<String> lops) {}
 @PutMapping("/{id}/classes") public ResponseEntity<?> updateClasses(@PathVariable String id,
       @RequestBody MultiClassUpdateRequest request,Authentication auth){
  Schedule current=repo.findById(id).orElse(null);
  if(current==null)return ResponseEntity.notFound().build();
  if(request==null||request.schedule()==null||request.lops()==null)
   return ResponseEntity.badRequest().body("Thiếu thông tin lịch học hoặc danh sách lớp");
  if(!blank(current.getPlanId()))return ResponseEntity.status(HttpStatus.CONFLICT).body("Lịch tự động phải được tạo lại theo kế hoạch");
  String groupId=trim(current.getClassGroupId());
  List<Schedule> groupRows=groupId.isEmpty()?List.of(current):repo.findAll().stream()
    .filter(row->groupId.equals(row.getClassGroupId())).toList();
  if(groupRows.isEmpty())return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null||groupRows.stream().anyMatch(row->!ownedBy(row,me)))
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn chỉ được sửa lịch giảng của mình");
  }else if(!hasRole(auth,"ADMIN"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  if(request.lops().isEmpty()||request.lops().size()>50)
   return ResponseEntity.badRequest().body("Hãy chọn từ 1 đến 50 lớp");
  LinkedHashMap<String,String> chosen=new LinkedHashMap<>();
  for(String raw:request.lops()){
   String code=trim(raw).toUpperCase(Locale.ROOT);
   if(code.isBlank())return ResponseEntity.badRequest().body("Mã lớp không được để trống");
   if(chosen.putIfAbsent(code,code)!=null)
    return ResponseEntity.badRequest().body("Lớp bị chọn trùng: "+code);
  }
  Set<String> ignoredIds=new HashSet<>();
  for(Schedule row:groupRows)if(row.getId()!=null)ignoredIds.add(row.getId());
  String targetGroupId=groupId.isEmpty()?UUID.randomUUID().toString():groupId;
  List<Schedule> updated=new ArrayList<>();
  Set<String> reusedIds=new HashSet<>();
  for(String code:chosen.values()){
   Schedule previous=groupRows.stream().filter(row->normalize(row.getLop()).equals(normalize(code))).findFirst().orElse(null);
   // If the original class is no longer selected, reuse its ID for the first new class.
   if(previous==null&&updated.isEmpty())previous=current;
   Schedule candidate=copyForClass(request.schedule(),code);
   String validation=validate(candidate,auth,previous==null?current.getId():previous.getId(),ignoredIds);
   if(validation!=null)return ResponseEntity.badRequest().body(code+": "+validation);
   if(previous!=null&&!reusedIds.contains(previous.getId())){
    candidate.setId(previous.getId());
    reusedIds.add(previous.getId());
   }
   candidate.setClassGroupId(targetGroupId);
   updated.add(candidate);
  }
  List<Schedule> saved=repo.saveAll(updated);
  List<Schedule> removed=groupRows.stream().filter(row->!reusedIds.contains(row.getId())).toList();
  if(!removed.isEmpty())repo.deleteAll(removed);
  return ResponseEntity.ok(saved);
 }
 private Schedule copyForClass(Schedule source,String code){
  Schedule row=new Schedule();
  row.setLop(code);row.setCourseId(source.getCourseId());row.setLecturerId(source.getLecturerId());
  row.setThu(source.getThu());row.setCaHoc(source.getCaHoc());row.setPhongHoc(source.getPhongHoc());
  row.setTietBatDau(source.getTietBatDau());row.setSoTiet(source.getSoTiet());
  row.setNgayBatDau(source.getNgayBatDau());row.setNgayKetThuc(source.getNgayKetThuc());
  return row;
 }
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody Schedule s,Authentication auth){
  Schedule current=repo.findById(id).orElse(null);if(current==null)return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")&&!ownedBy(current,currentLecturer(auth)))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn chỉ được sửa lịch giảng của mình");
  if(current.getPlanId()!=null&&!current.getPlanId().isBlank())return ResponseEntity.status(HttpStatus.CONFLICT).body("Lịch thuộc kế hoạch tự động. Hãy xóa toàn bộ kế hoạch rồi tạo lại để giữ đúng số buổi.");
  if(!blank(current.getClassGroupId()))return ResponseEntity.status(HttpStatus.CONFLICT).body("Lịch nhiều lớp phải được sửa đồng thời qua mục Lịch giảng & Công việc.");
  String error=validate(s,auth,id);if(error!=null)return ResponseEntity.badRequest().body(error);
  s.setId(id);s.setPlanId(current.getPlanId());return ResponseEntity.ok(repo.save(s));
 }
 /** Admin/lecturer creates the entire course calendar in one request. */
 /** A single shared lesson plan may be assigned to several classes. */
 public record AutoPlanRequest(String courseId,String lecturerId,String lop,List<String> lops,
                               String phongHoc,String caHoc,Integer tietBatDau,
                               String ngayBatDau,List<String> weekdays) {}
 @PostMapping("/auto-plan") public ResponseEntity<?> autoPlan(@RequestBody AutoPlanRequest request,Authentication auth){
  if(request==null)return ResponseEntity.badRequest().body("Thiếu thông tin kế hoạch");
  Course course=courses.findById(trim(request.courseId())).orElse(null);
  if(course==null)return ResponseEntity.badRequest().body("Chọn học phần đã được tạo");
  SchedulePlanCalculator.Plan plan;
  try{
   plan=SchedulePlanCalculator.calculate(LocalDate.parse(trim(request.ngayBatDau())),request.weekdays(),course.getCredits()==null?0:course.getCredits());
  }catch(DateTimeParseException ex){return ResponseEntity.badRequest().body("Ngày bắt đầu phải là YYYY-MM-DD");}
   catch(IllegalArgumentException ex){return ResponseEntity.badRequest().body(ex.getMessage());}
  if(request.tietBatDau()==null||request.tietBatDau()<1||request.tietBatDau()>14)
   return ResponseEntity.badRequest().body("Tiết bắt đầu phải từ 1 đến 14 (mỗi buổi 3 tiết)");

  // Accept both new multi-class payload (lops) and older single-class payload (lop).
  List<String> rawClasses=request.lops()!=null&&!request.lops().isEmpty()
      ?request.lops():List.of(trim(request.lop()));
  if(rawClasses.size()>50)return ResponseEntity.badRequest().body("Một kế hoạch chỉ được chọn tối đa 50 lớp");
  LinkedHashMap<String,String> uniqueClasses=new LinkedHashMap<>();
  for(String code:rawClasses){
   String name=trim(code).toUpperCase(Locale.ROOT);
   if(name.isBlank())return ResponseEntity.badRequest().body("Hãy chọn ít nhất một lớp học");
   if(uniqueClasses.putIfAbsent(name,name)!=null)
    return ResponseEntity.badRequest().body("Danh sách lớp bị trùng: "+name);
  }
  if(uniqueClasses.isEmpty())return ResponseEntity.badRequest().body("Hãy chọn ít nhất một lớp học");

  String start=trim(request.ngayBatDau()),end=plan.lastDate().toString();
  List<Schedule> existingRows=repo.findAll();
  // Reject duplicate course/class plans before writing any rows.
  for(String classCode:uniqueClasses.values()){
   for(Schedule existing:existingRows){
    if(course.getId().equals(existing.getCourseId())
       &&normalize(classCode).equals(normalize(existing.getLop()))
       &&dateRangesOverlap(start,end,trim(existing.getNgayBatDau()),trim(existing.getNgayKetThuc())))
     return ResponseEntity.status(HttpStatus.CONFLICT).body("Lớp "+classCode+" đã có lịch cho học phần này trong khoảng thời gian đã chọn.");
   }
  }

  // All classes belong to ONE shared plan; keep one row per class/weekday so
  // existing student timetable queries and lecturer payroll still work.
  String planId=UUID.randomUUID().toString();
  List<Schedule> rows=new ArrayList<>();
  for(String weekday:request.weekdays()){
   for(String classCode:uniqueClasses.values()){
    Schedule row=new Schedule();
    row.setCourseId(course.getId());row.setLecturerId(trim(request.lecturerId()));
    row.setLop(classCode);row.setThu(weekday);row.setCaHoc(request.caHoc());
    row.setPhongHoc(request.phongHoc());row.setTietBatDau(request.tietBatDau());row.setSoTiet(3);
    row.setNgayBatDau(start);row.setNgayKetThuc(end);row.setPlanId(planId);
    String error=validate(row,auth,null);
    if(error!=null)return ResponseEntity.badRequest().body(classCode+" / "+weekday+": "+error);
    rows.add(row);
   }
  }
  // No writes before every selected class and weekday passes validation.
  List<Schedule> saved=repo.saveAll(rows);
  int classCount=uniqueClasses.size();
  int meetings=course.getCredits()*5;
  Map<String,Object> response=new LinkedHashMap<>();
  response.put("planId",planId);
  response.put("courseId",course.getId());
  response.put("credits",course.getCredits());
  response.put("totalPeriods",course.getCredits()*15);
  response.put("totalMeetings",meetings);
  response.put("classCount",classCount);
  response.put("classes",new ArrayList<>(uniqueClasses.values()));
  response.put("totalClassMeetings",meetings*classCount);
  response.put("daysPerWeek",request.weekdays().size());
  response.put("firstClassDate",plan.firstDate().toString());
  response.put("endDate",end);
  response.put("schedules",saved);
  return ResponseEntity.status(HttpStatus.CREATED).body(response);
 }
 @DeleteMapping("/auto-plan/{planId}") public ResponseEntity<?> deleteAutoPlan(@PathVariable String planId,Authentication auth){
  List<Schedule> rows=repo.findAll().stream().filter(s->planId.equals(s.getPlanId())).toList();
  if(rows.isEmpty())return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null||rows.stream().anyMatch(s->!ownedBy(s,me)))
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền xóa kế hoạch này");
  }else if(!hasRole(auth,"ADMIN"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  repo.deleteAll(rows);
  return ResponseEntity.noContent().build();
 }
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id,Authentication auth){
  if(!hasRole(auth,"ADMIN")&&!hasRole(auth,"LECTURER"))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
  Schedule current=repo.findById(id).orElse(null);if(current==null)return ResponseEntity.notFound().build();
  if(hasRole(auth,"LECTURER")&&!ownedBy(current,currentLecturer(auth)))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn chỉ được xóa lịch giảng của mình");
  if(current.getPlanId()!=null&&!current.getPlanId().isBlank())return ResponseEntity.status(HttpStatus.CONFLICT).body("Hãy xóa toàn bộ kế hoạch tự động, không xóa riêng một thứ học.");
  if(!blank(current.getClassGroupId())){
   List<Schedule> groupRows=repo.findAll().stream()
    .filter(row->current.getClassGroupId().equals(row.getClassGroupId())).toList();
   if(hasRole(auth,"LECTURER")&&groupRows.stream().anyMatch(row->!ownedBy(row,currentLecturer(auth))))
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền xóa nhóm lịch này");
   repo.deleteAll(groupRows);
  }else repo.deleteById(id);
  return ResponseEntity.noContent().build();
 }
 private String validate(Schedule s,Authentication auth,String editingId){
  return validate(s,auth,editingId,editingId==null?Set.of():Set.of(editingId));
 }
 private String validate(Schedule s,Authentication auth,String editingId,Set<String> ignoredIds){
  if(s==null)return "Thiếu dữ liệu lịch học";
  s.setLop(trim(s.getLop()));s.setThu(trim(s.getThu()));s.setCaHoc(trim(s.getCaHoc()));s.setPhongHoc(trim(s.getPhongHoc()));
  if(s.getLop().isBlank()||s.getThu().isBlank()||s.getCaHoc().isBlank()||s.getPhongHoc().isBlank())return "Vui lòng nhập lớp, thứ, ca học và phòng";
  Schedule old = editingId == null ? null : repo.findById(editingId).orElse(null);
  boolean unchangedLegacy = old != null && s.getLop().equalsIgnoreCase(trim(old.getLop()));
  if (!unchangedLegacy && academicClasses.findByCodeIgnoreCase(s.getLop()).isEmpty())
   return "Hãy chọn lớp đã tạo trong mục Khoa & Lớp";
  s.setLop(s.getLop().toUpperCase(Locale.ROOT));
  if(!List.of("Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ nhật").contains(s.getThu()))return "Thứ không hợp lệ";
  Integer first=s.getTietBatDau(), count=s.getSoTiet();
  if((first==null)!=(count==null))return "Vui lòng nhập cả tiết bắt đầu và số tiết";
  if(first!=null&&(first<1||first>16||count<1||count>10||first+count-1>16))return "Tiết học không hợp lệ (1–16, tối đa 10 tiết)";
  if(count!=null&&count!=3&&(old==null||!Objects.equals(count,old.getSoTiet())))
   return "Mỗi buổi học mới phải có đúng 3 tiết";
  String start=trim(s.getNgayBatDau()),end=trim(s.getNgayKetThuc());
  try{
   if(!start.isEmpty())LocalDate.parse(start);
   if(!end.isEmpty())LocalDate.parse(end);
   if(!start.isEmpty()&&!end.isEmpty()&&LocalDate.parse(start).isAfter(LocalDate.parse(end)))return "Ngày kết thúc phải sau ngày bắt đầu";
  }catch(DateTimeParseException ex){return "Ngày bắt đầu/kết thúc phải có định dạng YYYY-MM-DD";}
  s.setNgayBatDau(start);s.setNgayKetThuc(end);
  Course course=courses.findById(trim(s.getCourseId())).orElse(null);
  if(course==null)return "Chọn học phần đã được tạo";
  String lecturerId=trim(s.getLecturerId());
  if(hasRole(auth,"LECTURER")){
   Lecturer me=currentLecturer(auth);
   if(me==null)return "Không xác định được giảng viên";
   boolean allowed=me.getId().equals(course.getLecturerId())||repo.findAll().stream().anyMatch(existing->me.getId().equals(existing.getLecturerId())&&course.getId().equals(existing.getCourseId()));
   if(!allowed)return "Bạn chỉ được xếp lịch cho học phần mình được phân công";
   lecturerId=me.getId(); // Không tin lecturerId do trình duyệt gửi.
  }else if(!hasRole(auth,"ADMIN"))return "Không có quyền xếp lịch";
  if(lecturerId.isBlank())lecturerId=trim(course.getLecturerId());
  Lecturer lecturer=lecturers.findById(lecturerId).orElse(null);
  if(lecturer==null)return "Chọn giảng viên có trong danh sách";
  s.setCourseId(course.getId());s.setLecturerId(lecturer.getId());s.setTenMonHoc(course.getName());s.setGiangVien(lecturer.getFullName());
  // Kiểm tra trùng tiết trong cùng thứ, khoảng ngày có giao nhau.
  if(first!=null){
   for(Schedule other:repo.findAll()){
    if(other.getId()!=null&&ignoredIds.contains(other.getId()))continue;
    if(!s.getThu().equals(other.getThu())||other.getTietBatDau()==null||other.getSoTiet()==null)continue;
    if(first>other.getTietBatDau()+other.getSoTiet()-1||other.getTietBatDau()>first+count-1)continue;
    if(!dateRangesOverlap(start,end,trim(other.getNgayBatDau()),trim(other.getNgayKetThuc())))continue;
    if(normalize(s.getLop()).equals(normalize(other.getLop())))return "Trùng tiết học với một môn khác của lớp "+s.getLop();
    if(lecturer.getId().equals(other.getLecturerId()))return "Giảng viên đã có lịch trong khoảng tiết này";
    if(normalize(s.getPhongHoc()).equals(normalize(other.getPhongHoc())))return "Phòng học đã được sử dụng trong khoảng tiết này";
   }
  }
  return null;
 }
 private boolean dateRangesOverlap(String aStart,String aEnd,String bStart,String bEnd){
  // Ngày trống = lịch không giới hạn (tương thích dữ liệu cũ).
  return (aEnd.isEmpty()||bStart.isEmpty()||aEnd.compareTo(bStart)>=0)
      &&(bEnd.isEmpty()||aStart.isEmpty()||bEnd.compareTo(aStart)>=0);
 }
 private boolean ownedBy(Schedule s,Lecturer me){
  return me!=null&&(me.getId().equals(s.getLecturerId())||
    (blank(s.getLecturerId())&&normalize(me.getFullName()).equals(normalize(s.getGiangVien()))));
 }
 private Lecturer currentLecturer(Authentication auth){return lecturers.findByEmailIgnoreCase(auth.getName()).orElse(null);}
 private List<Schedule> byClass(String lop){return repo.findAll().stream().filter(s->!normalize(lop).isEmpty()&&normalize(lop).equals(normalize(s.getLop()))).toList();}
 private String normalize(String s){return s==null?"":s.replace('\u00a0',' ').trim().replaceAll("\\s+"," ").toLowerCase(Locale.ROOT);}
 private boolean blank(String s){return s==null||s.isBlank();}
 private String trim(String s){return s==null?"":s.trim();}
 private boolean hasRole(Authentication auth,String role){return auth!=null&&auth.getAuthorities().stream().anyMatch(a->("ROLE_"+role).equals(a.getAuthority()));}
}
