package com.example.demo;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface ExamRepository extends MongoRepository<Exam,String> {  }
