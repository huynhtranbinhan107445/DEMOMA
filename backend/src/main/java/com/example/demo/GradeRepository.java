package com.example.demo;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface GradeRepository extends MongoRepository<Grade,String> {
 List<Grade> findByMaSVIgnoreCase(String maSV);
}
