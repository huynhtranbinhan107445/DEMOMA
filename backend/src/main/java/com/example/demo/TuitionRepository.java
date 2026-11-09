package com.example.demo;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface TuitionRepository extends MongoRepository<Tuition,String> {  List<Tuition> findByMaSVIgnoreCase(String maSV); }
