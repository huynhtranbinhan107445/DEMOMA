package com.example.demo;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface LecturerRepository extends MongoRepository<Lecturer,String> {
 Optional<Lecturer> findByEmailIgnoreCase(String email);
 Optional<Lecturer> findByCodeIgnoreCase(String code);
}
