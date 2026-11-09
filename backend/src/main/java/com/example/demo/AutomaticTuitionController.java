package com.example.demo;

import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Calculated tuition, not payment receipts. No duplicate tuition documents are created. */
@RestController
@RequestMapping("/api/tuition/automatic")
public class AutomaticTuitionController {
    private final EnrollmentRepository enrollments;
    private final CourseRepository courses;
    private final StudentRepository students;
    private final CreditPriceRepository prices;

    public AutomaticTuitionController(EnrollmentRepository enrollments, CourseRepository courses,
                                      StudentRepository students, CreditPriceRepository prices) {
        this.enrollments=enrollments;this.courses=courses;this.students=students;this.prices=prices;
    }

    public record TuitionSummary(String maSV, String semester, long courseCount, long totalCredits,
                                 long amount, boolean estimated) {}
    private static final class MutableSummary {
        String maSV, semester;
        long courseCount, totalCredits, amount;
        boolean estimated;
        MutableSummary(String maSV, String semester) { this.maSV=maSV;this.semester=semester; }
        TuitionSummary result() { return new TuitionSummary(maSV,semester,courseCount,totalCredits,amount,estimated); }
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        boolean admin=auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        String studentCode="";
        if(!admin) {
            Optional<Student> student=students.findByEmail(auth.getName());
            if(student.isEmpty())return ResponseEntity.status(403).body("Không tìm thấy hồ sơ sinh viên");
            studentCode=student.get().getMaSV();
        }
        Long currentPrice=prices.findById("default").map(CreditPriceSetting::getPricePerCredit).orElse(null);
        Map<String, Course> courseById=new HashMap<>();
        for(Course course:courses.findAll())courseById.put(course.getId(),course);
        Map<String, MutableSummary> summary=new LinkedHashMap<>();
        List<Enrollment> items=admin?enrollments.findAll():enrollments.findByMaSVIgnoreCase(studentCode);
        for(Enrollment item:items) {
            Course course=courseById.get(item.getCourseId());
            Integer credits=item.getCreditsAtRegistration()!=null?item.getCreditsAtRegistration():(course!=null?course.getCredits():null);
            // Old registrations without a valid course/credit count cannot be charged reliably.
            if(credits==null||credits<=0)continue;
            String semester=item.getSemester()!=null&&!item.getSemester().isBlank()?item.getSemester():(course!=null?course.getSemester():null);
            if(semester==null)semester="Chưa xác định";
            final String term=semester;
            String key=item.getMaSV().toLowerCase(Locale.ROOT)+"\u0000"+term;
            MutableSummary group=summary.computeIfAbsent(key,k->new MutableSummary(item.getMaSV(),term));
            group.courseCount++;
            group.totalCredits+=credits;
            if(item.getTuitionAmount()!=null)group.amount+=item.getTuitionAmount();
            else {
                // Old enrollments have no stored price. Show an estimate using the current rate.
                group.estimated=true;
                if(currentPrice!=null&&currentPrice>0)group.amount+=Math.multiplyExact(currentPrice,credits.longValue());
            }
        }
        List<TuitionSummary> results=summary.values().stream().map(MutableSummary::result).toList();
        return ResponseEntity.ok(results);
    }
}
