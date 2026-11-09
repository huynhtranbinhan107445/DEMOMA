package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CreditPriceRepository extends MongoRepository<CreditPriceSetting, String> {}
