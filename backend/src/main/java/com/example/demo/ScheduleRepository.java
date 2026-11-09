package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ScheduleRepository extends MongoRepository<Schedule, String> {
    // Tìm thời khóa biểu theo Lớp
    List<Schedule> findByLopIgnoreCase(String lop);
}