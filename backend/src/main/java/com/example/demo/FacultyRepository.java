package com.example.demo;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FacultyRepository extends MongoRepository<Faculty, String> {
    Optional<Faculty> findByCodeIgnoreCase(String code);
}
