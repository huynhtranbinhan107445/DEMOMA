package com.example.demo;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

@Configuration
public class StudentUniqueIndexConfig {
    @Bean ApplicationRunner ensureStudentCodeIndex(MongoTemplate mongo) {
        return args -> mongo.indexOps(Student.class).ensureIndex(
            new Index().on("maSV", org.springframework.data.domain.Sort.Direction.ASC)
                .unique().sparse().named("unique_student_code"));
    }
}
