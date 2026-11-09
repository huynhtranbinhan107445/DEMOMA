package com.example.demo;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class AcademicStructureController {
    private final FacultyRepository faculties;
    private final AcademicClassRepository classes;
    private final StudentRepository students;
    private final ScheduleRepository schedules;
    private final CourseRepository courses;
    private final LecturerRepository lecturers;
    private final TeachingTaskRepository tasks;

    public AcademicStructureController(FacultyRepository faculties, AcademicClassRepository classes,
        StudentRepository students, ScheduleRepository schedules, CourseRepository courses,
        LecturerRepository lecturers, TeachingTaskRepository tasks) {
        this.faculties = faculties; this.classes = classes; this.students = students;
        this.schedules = schedules; this.courses = courses; this.lecturers = lecturers; this.tasks = tasks;
    }

    public record FacultyInput(String code, String name) {}
    public record ClassInput(String facultyId, String cohort, String section) {}

    @GetMapping("/api/faculties")
    public List<Faculty> listFaculties() {
        return faculties.findAll().stream().sorted(Comparator.comparing(Faculty::getCode)).toList();
    }

    @PostMapping("/api/faculties")
    public ResponseEntity<?> createFaculty(@RequestBody FacultyInput input) {
        String code = upper(input == null ? null : input.code());
        String name = trim(input == null ? null : input.name());
        if (!code.matches("[A-Z]{2,8}") || name.isBlank() || name.length() > 120)
            return ResponseEntity.badRequest().body("Mã khoa gồm 2-8 chữ cái A-Z, tên khoa từ 1-120 ký tự");
        if (faculties.findByCodeIgnoreCase(code).isPresent())
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã khoa đã tồn tại");
        Faculty faculty = new Faculty(); faculty.setCode(code); faculty.setName(name);
        return ResponseEntity.status(HttpStatus.CREATED).body(faculties.save(faculty));
    }

    @PutMapping("/api/faculties/{id}")
    public ResponseEntity<?> updateFaculty(@PathVariable String id, @RequestBody FacultyInput input) {
        Faculty faculty = faculties.findById(id).orElse(null);
        if (faculty == null) return ResponseEntity.notFound().build();
        String name = trim(input == null ? null : input.name());
        if (name.isBlank() || name.length() > 120) return ResponseEntity.badRequest().body("Tên khoa không hợp lệ");
        // Mã khoa là định danh cố định, không đổi để bảo toàn mã lớp đã tạo.
        faculty.setName(name);
        return ResponseEntity.ok(faculties.save(faculty));
    }

    @DeleteMapping("/api/faculties/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable String id) {
        Faculty faculty = faculties.findById(id).orElse(null);
        if (faculty == null) return ResponseEntity.notFound().build();
        String code = faculty.getCode();
        if (classes.existsByFacultyId(id) || courses.findAll().stream().anyMatch(c -> code.equalsIgnoreCase(trim(c.getDepartment())))
            || lecturers.findAll().stream().anyMatch(l -> code.equalsIgnoreCase(trim(l.getDepartment()))))
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Khoa đang có lớp, học phần hoặc giảng viên; không thể xóa");
        faculties.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/academic-classes")
    public List<AcademicClass> listClasses() {
        return classes.findAll().stream().sorted(Comparator.comparing(AcademicClass::getCode)).toList();
    }

    @PostMapping("/api/academic-classes")
    public ResponseEntity<?> createClass(@RequestBody ClassInput input) {
        Faculty faculty = input == null || input.facultyId() == null ? null : faculties.findById(input.facultyId()).orElse(null);
        if (faculty == null) return ResponseEntity.badRequest().body("Hãy chọn khoa đã có");
        String cohort = trim(input.cohort());
        String section = upper(input.section());
        if (!cohort.matches("[0-9]{2}") || !section.matches("[A-Z]{1,2}"))
            return ResponseEntity.badRequest().body("Khóa gồm 2 chữ số (VD: 24); lớp gồm 1-2 chữ cái (VD: A)");
        String code = faculty.getCode() + cohort + section;
        if (classes.findByCodeIgnoreCase(code).isPresent())
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã lớp " + code + " đã tồn tại");
        AcademicClass result = new AcademicClass();
        result.setCode(code); result.setFacultyId(faculty.getId()); result.setCohort(cohort); result.setSection(section);
        return ResponseEntity.status(HttpStatus.CREATED).body(classes.save(result));
    }

    @DeleteMapping("/api/academic-classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable String id) {
        AcademicClass academicClass = classes.findById(id).orElse(null);
        if (academicClass == null) return ResponseEntity.notFound().build();
        String code = academicClass.getCode();
        if (students.findAll().stream().anyMatch(s -> code.equalsIgnoreCase(trim(s.getLop())))
            || schedules.findAll().stream().anyMatch(s -> code.equalsIgnoreCase(trim(s.getLop())))
            || tasks.findAll().stream().anyMatch(t -> code.equalsIgnoreCase(trim(t.getClassName()))))
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Lớp đang có sinh viên, thời khóa biểu hoặc công việc; không thể xóa");
        classes.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String trim(String value) { return value == null ? "" : value.trim(); }
    private String upper(String value) { return trim(value).toUpperCase(Locale.ROOT); }
}
