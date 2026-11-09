package com.example.demo;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AcademicClassRepository extends MongoRepository<AcademicClass, String> {
    Optional<AcademicClass> findByCodeIgnoreCase(String code);
    boolean existsByFacultyId(String facultyId);
}
