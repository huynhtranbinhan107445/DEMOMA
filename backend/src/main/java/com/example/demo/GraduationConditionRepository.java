package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GraduationConditionRepository extends MongoRepository<GraduationCondition, String> {
    Optional<GraduationCondition> findByCohort(String cohort);
}
