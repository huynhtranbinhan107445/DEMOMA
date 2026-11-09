package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SchoolInfoRepository extends MongoRepository<SchoolInfo, String> {}
