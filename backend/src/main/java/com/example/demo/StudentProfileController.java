package com.example.demo;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/profile")
public class StudentProfileController {
 private final StudentRepository students;
 public StudentProfileController(StudentRepository students){this.students=students;}
 @GetMapping("/me") public ResponseEntity<Student> me(org.springframework.security.core.Authentication auth){
  return students.findByEmail(auth.getName()).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
 }
}
