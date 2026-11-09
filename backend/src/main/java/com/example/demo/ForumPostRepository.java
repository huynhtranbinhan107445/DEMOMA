package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ForumPostRepository extends MongoRepository<ForumPost, String> {}
