package com.example.demo;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface CourseRepository extends MongoRepository<Course,String> {
 Optional<Course> findByCodeIgnoreCase(String code);
}
