package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Single school-wide credit price. Only administrators may update it. */
@Document(collection = "credit_price_settings")
public class CreditPriceSetting {
    @Id private String id;
    private Long pricePerCredit;
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getPricePerCredit() { return pricePerCredit; }
    public void setPricePerCredit(Long pricePerCredit) { this.pricePerCredit = pricePerCredit; }
}
