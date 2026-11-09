package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.text.Normalizer;
import java.security.SecureRandom;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Autowired private LecturerRepository lecturerRepository;
    @Autowired private AcademicClassRepository academicClassRepository;
    private final SecureRandom random = new SecureRandom();

    private String emailFor(String fullName, String studentCode) {
        if (fullName == null || fullName.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ tên không được để trống");
        String[] words = fullName.trim().split("\\s+");
        String last = words[words.length - 1].replace('đ','d').replace('Đ','D');
        last = Normalizer.normalize(last, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        last = last.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        if (last.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên sinh viên không hợp lệ");
        return last + studentCode + "@donga.edu.vn";
    }
    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(org.springframework.security.core.Authentication auth) {
        return identity(auth);
    }
    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        return identity(auth);
    }
    private ResponseEntity<?> identity(org.springframework.security.core.Authentication auth) {
        if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN")))
            return ResponseEntity.ok(Map.of("role","ADMIN","name","Quản trị viên"));
        if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_LECTURER")))
            return lecturerRepository.findByEmailIgnoreCase(auth.getName())
                .<ResponseEntity<?>>map(l->ResponseEntity.ok(Map.of("role","LECTURER","name",l.getFullName(),"lecturerId",l.getId())))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        return studentRepository.findByEmail(auth.getName())
            .<ResponseEntity<?>>map(s->ResponseEntity.ok(Map.of("role","STUDENT","name",s.getHoTen(),"maSV",s.getMaSV())))
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
    @PostMapping("/api/auth/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String,String> body,org.springframework.security.core.Authentication auth) {
        if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN")))
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Đổi mật khẩu Admin qua biến môi trường.");
        String next=body.get("newPassword");
        if(next==null||next.length()<10)return ResponseEntity.badRequest().body("Mật khẩu mới tối thiểu 10 ký tự");
        if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_LECTURER"))){
            Lecturer l=lecturerRepository.findByEmailIgnoreCase(auth.getName()).orElseThrow();
            String old=body.get("oldPassword");
            if(old==null||!passwordEncoder.matches(old,l.getPassword()))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Mật khẩu cũ không đúng");
            l.setPassword(passwordEncoder.encode(next));lecturerRepository.save(l);
            return ResponseEntity.ok("Đã đổi mật khẩu");
        }
        Student s=studentRepository.findByEmail(auth.getName()).orElseThrow();
        String old=body.get("oldPassword");
        if(old==null||!passwordEncoder.matches(old,s.getPassword()))return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Mật khẩu cũ không đúng");
        s.setPassword(passwordEncoder.encode(next));studentRepository.save(s);
        return ResponseEntity.ok("Đã đổi mật khẩu");
    }

    // --- API QUẢN LÝ SINH VIÊN ---

    @GetMapping("/api/students")
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @GetMapping("/api/students/{maSV}")
    public ResponseEntity<Student> getStudentByMaSV(@PathVariable String maSV) {
        return studentRepository.findByMaSVIgnoreCase(maSV)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/students")
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        if (student.getHoTen() == null || student.getHoTen().isBlank() || student.getLop() == null || student.getLop().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nhập họ tên và lớp");
        String classCode = student.getLop().trim().toUpperCase(Locale.ROOT);
        if (academicClassRepository.findByCodeIgnoreCase(classCode).isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy chọn lớp đã được tạo tại mục Khoa & Lớp");
        student.setLop(classCode);
        if (student.getPassword() == null || student.getPassword().length() < 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu ban đầu cần ít nhất 10 ký tự");
        // Never trust a client-supplied code, email, or MongoDB id.
        student.setId(null);
        student.setPassword(passwordEncoder.encode(student.getPassword()));
        for (int attempt = 0; attempt < 40; attempt++) {
            String code = String.format(Locale.ROOT, "%06d", 100000 + random.nextInt(900000));
            if (studentRepository.existsByMaSVIgnoreCase(code)) continue;
            student.setMaSV(code);
            student.setEmail(emailFor(student.getHoTen(), code));
            if (studentRepository.existsByEmailIgnoreCase(student.getEmail())) continue;
            try { return ResponseEntity.status(HttpStatus.CREATED).body(studentRepository.save(student)); }
            catch (DuplicateKeyException collision) { student.setId(null); }
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể cấp mã sinh viên duy nhất. Hãy thử lại");
    }

    @PutMapping("/api/students/{maSV}")
    public ResponseEntity<Student> updateStudent(@PathVariable String maSV, @RequestBody Student details) {
        Student student = studentRepository.findByMaSVIgnoreCase(maSV).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (details.getHoTen() != null && !details.getHoTen().isBlank()) {
            // For legacy students, preserve their existing email unless the name actually changes.
            if (!details.getHoTen().trim().equals(student.getHoTen())) {
                String generated = emailFor(details.getHoTen(), student.getMaSV());
                if (!generated.equalsIgnoreCase(student.getEmail()) && studentRepository.existsByEmailIgnoreCase(generated))
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                student.setEmail(generated);
            }
            student.setHoTen(details.getHoTen().trim());
        }
        if (details.getLop() != null) {
            String classCode = details.getLop().trim().toUpperCase(Locale.ROOT);
            if (classCode.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lớp không được để trống");
            // Hồ sơ cũ có thể dùng mã lớp chưa được khai báo. Giữ nguyên nếu không đổi lớp.
            if (!classCode.equalsIgnoreCase(student.getLop()) && academicClassRepository.findByCodeIgnoreCase(classCode).isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lớp chưa được tạo tại mục Khoa & Lớp");
            student.setLop(classCode);
        }
        if (details.getSoDienThoai() != null) student.setSoDienThoai(details.getSoDienThoai().trim());
        // Ignore client-supplied maSV, id, email, password in profile updates.
        try { return ResponseEntity.ok(studentRepository.save(student)); }
        catch (DuplicateKeyException e) { return ResponseEntity.status(HttpStatus.CONFLICT).build(); }
    }

    @DeleteMapping("/api/students/{maSV}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String maSV) {
        Student student = studentRepository.findByMaSVIgnoreCase(maSV).orElse(null);

        if (student != null) {
            studentRepository.delete(student);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/api/students/search")
    public List<Student> searchStudents(@RequestParam String keyword) {
        return studentRepository.findByMaSVContainingIgnoreCaseOrHoTenContainingIgnoreCaseOrEmailContainingIgnoreCase(
                keyword, keyword, keyword);
    }
}