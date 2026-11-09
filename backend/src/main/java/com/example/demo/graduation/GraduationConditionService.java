package com.example.demo.graduation;

import com.example.demo.GraduationCondition;
import com.example.demo.GraduationConditionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class GraduationConditionService {
    private final GraduationConditionRepository repository;
    public GraduationConditionService(GraduationConditionRepository repository) { this.repository=repository; }

    private boolean visible(GraduationCondition c) { return !Boolean.TRUE.equals(c.getDeleted()); }
    private boolean active(GraduationCondition c) { return visible(c) && Boolean.TRUE.equals(c.getIsActive()); }
    public List<GraduationCondition> all(boolean admin) {
        return repository.findAll().stream()
            .filter(c -> admin ? visible(c) : active(c))
            .sorted(Comparator.comparing(GraduationCondition::getCohort, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
            .toList();
    }
    public GraduationCondition one(String id, boolean admin) {
        GraduationCondition c=repository.findById(id).orElseThrow(() -> notFound("Không tìm thấy điều kiện tốt nghiệp"));
        if (!(admin ? visible(c) : active(c))) throw notFound("Không tìm thấy điều kiện tốt nghiệp đang áp dụng");
        return c;
    }
    public GraduationCondition byCohort(String cohort) {
        String key=normalize(cohort);
        return repository.findAll().stream().filter(c -> active(c) && key.equalsIgnoreCase(c.getCohort()))
            .findFirst().orElseThrow(() -> notFound("Chưa có điều kiện đang áp dụng cho khóa " + key));
    }
    public GraduationCondition create(GraduationConditionRequest r) {
        String key=validate(r);
        ensureUnique(key, null);
        GraduationCondition c=new GraduationCondition();
        c.setCreatedAt(LocalDateTime.now());c.setIsActive(true);c.setDeleted(false);
        apply(c,r,key);
        return repository.save(c);
    }
    public GraduationCondition update(String id, GraduationConditionRequest r) {
        GraduationCondition c=one(id,true);
        String key=validate(r);
        ensureUnique(key,id);
        apply(c,r,key);
        return repository.save(c);
    }
    public GraduationCondition toggle(String id) {
        GraduationCondition c=one(id,true);
        c.setIsActive(!Boolean.TRUE.equals(c.getIsActive()));
        c.setUpdatedAt(LocalDateTime.now());
        return repository.save(c);
    }
    public void softDelete(String id) {
        GraduationCondition c=one(id,true);
        c.setDeleted(true);c.setIsActive(false);
        c.setDeletedAt(LocalDateTime.now());c.setUpdatedAt(LocalDateTime.now());
        repository.save(c);
    }
    private void ensureUnique(String cohort, String excludeId) {
        boolean exists=repository.findAll().stream().anyMatch(c -> visible(c)
            && cohort.equalsIgnoreCase(c.getCohort()) && (excludeId==null || !excludeId.equals(c.getId())));
        if(exists) throw new ResponseStatusException(HttpStatus.CONFLICT,"Khóa " + cohort + " đã có bộ điều kiện. Hãy sửa bộ hiện có.");
    }
    private String normalize(String cohort) { return cohort==null ? "" : cohort.trim().toUpperCase(Locale.ROOT); }
    private String validate(GraduationConditionRequest r) {
        if(r==null) throw bad("Thiếu dữ liệu điều kiện tốt nghiệp");
        String key=normalize(r.cohort());
        if(!key.matches("K[0-9]{2,4}")) throw bad("Khóa phải có dạng K21, K22, K24...");
        if(r.minimumCredits()==null || r.minimumCredits()<0 || r.minimumCredits()>400) throw bad("Tín chỉ tối thiểu phải từ 0 đến 400");
        if(r.minimumGpa()==null || !Double.isFinite(r.minimumGpa()) || r.minimumGpa()<0 || r.minimumGpa()>4) throw bad("GPA tối thiểu phải từ 0 đến 4");
        if(r.maximumFailedCourses()==null || r.maximumFailedCourses()<0 || r.maximumFailedCourses()>100) throw bad("Số học phần chưa đạt tối đa phải từ 0 đến 100");
        if(r.foreignLanguageRequired()==null || r.itCertificateRequired()==null || r.conductRequired()==null) throw bad("Phải chọn các yêu cầu ngoại ngữ, tin học và rèn luyện");
        return key;
    }
    private void apply(GraduationCondition c, GraduationConditionRequest r, String key) {
        c.setCohort(key);c.setRequiredCredits(r.minimumCredits());c.setMinGpa(r.minimumGpa());
        c.setMaximumFailedCourses(r.maximumFailedCourses());
        c.setForeignLanguageRequired(r.foreignLanguageRequired());
        c.setItCertificateRequired(r.itCertificateRequired());c.setConductRequired(r.conductRequired());
        c.setForeignLanguageStandard(safe(r.foreignLanguageStandard()));
        c.setItStandard(safe(r.itStandard()));c.setConductStandard(safe(r.conductStandard()));
        c.setUpdatedAt(LocalDateTime.now());
    }
    private String safe(String s) { return s==null?"":s.trim(); }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private ResponseStatusException notFound(String message) { return new ResponseStatusException(HttpStatus.NOT_FOUND,message); }
}
