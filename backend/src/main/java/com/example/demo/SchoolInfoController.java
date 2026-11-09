package com.example.demo;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/public/school")
public class SchoolInfoController {
    private final SchoolInfoRepository repository;
    public SchoolInfoController(SchoolInfoRepository repository) { this.repository = repository; }

    @GetMapping
    public SchoolInfo get() { return repository.findById("main").orElseGet(() -> {
        SchoolInfo initial = new SchoolInfo(); initial.id = "main"; return initial;
    }); }

    @PutMapping
    public SchoolInfo update(@RequestBody SchoolInfo data) {
        if (data == null || data.name == null || data.name.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên trường không được để trống");
        SchoolInfo result = new SchoolInfo();
        result.id = "main";
        result.name = limited(data.name, 120);
        result.tagline = limited(data.tagline, 180);
        result.introduction = limited(data.introduction, 3000);
        result.training = limited(data.training, 3000);
        result.studentSupport = limited(data.studentSupport, 3000);
        result.address = limited(data.address, 240);
        result.email = limited(data.email, 150);
        result.phone = limited(data.phone, 60);
        result.website = limited(data.website, 240);
        return repository.save(result);
    }

    private String limited(String value, int max) {
        if (value == null) return "";
        String result = value.trim();
        if (result.length() > max) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung quá dài");
        return result;
    }
}
