package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AcademicStructureSeed {
    @Bean
    CommandLineRunner seedAcademicStructure(FacultyRepository faculties, AcademicClassRepository classes) {
        return args -> {
            Faculty it = faculties.findByCodeIgnoreCase("IT").orElseGet(() -> {
                Faculty value = new Faculty(); value.setCode("IT"); value.setName("Công nghệ thông tin");
                return faculties.save(value);
            });
            // Tạo ví dụ theo yêu cầu; không sửa bất kỳ sinh viên hay lịch cũ nào.
            if (classes.findByCodeIgnoreCase("IT24A").isEmpty()) {
                AcademicClass value = new AcademicClass();
                value.setFacultyId(it.getId()); value.setCohort("24"); value.setSection("A"); value.setCode("IT24A");
                classes.save(value);
            }
        };
    }
}
