package com.example.demo;

import com.example.demo.graduation.GraduationConditionRequest;
import com.example.demo.graduation.GraduationConditionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/graduation-conditions")
public class GraduationConditionController {
    private final GraduationConditionService service;
    public GraduationConditionController(GraduationConditionService service) { this.service=service; }
    private boolean admin(Authentication auth) {
        return auth!=null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
    @GetMapping
    public List<GraduationCondition> all(Authentication auth) { return service.all(admin(auth)); }
    @GetMapping("/cohort/{cohort}")
    public GraduationCondition byCohort(@PathVariable String cohort) { return service.byCohort(cohort); }
    @GetMapping("/{id}")
    public GraduationCondition one(@PathVariable String id, Authentication auth) { return service.one(id,admin(auth)); }
    @PostMapping
    public ResponseEntity<GraduationCondition> create(@RequestBody GraduationConditionRequest request) {
        GraduationCondition created=service.create(request);
        return ResponseEntity.created(URI.create("/api/graduation-conditions/"+created.getId())).body(created);
    }
    @PutMapping("/{id}")
    public GraduationCondition update(@PathVariable String id,@RequestBody GraduationConditionRequest request) {
        return service.update(id,request);
    }
    @PatchMapping("/{id}/toggle-status")
    public GraduationCondition toggle(@PathVariable String id) { return service.toggle(id); }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.softDelete(id); }
}
