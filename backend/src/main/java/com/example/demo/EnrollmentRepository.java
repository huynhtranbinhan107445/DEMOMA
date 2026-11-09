package com.example.demo;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface EnrollmentRepository extends MongoRepository<Enrollment,String> {
 List<Enrollment> findByMaSVIgnoreCase(String maSV);
 boolean existsByMaSVIgnoreCaseAndCourseId(String maSV,String courseId);
}
