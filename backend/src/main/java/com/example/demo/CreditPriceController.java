package com.example.demo;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/credit-price")
public class CreditPriceController {
    private final CreditPriceRepository repository;
    public CreditPriceController(CreditPriceRepository repository) { this.repository = repository; }

    @GetMapping
    public Map<String, Object> get() {
        Long price = repository.findById("default").map(CreditPriceSetting::getPricePerCredit).orElse(null);
        return Map.of("configured", price != null && price > 0,
                      "pricePerCredit", price == null ? 0L : price);
    }

    public record PriceRequest(Long pricePerCredit) {}

    @PutMapping
    public ResponseEntity<?> update(@RequestBody PriceRequest request) {
        if (request == null || request.pricePerCredit() == null ||
            request.pricePerCredit() <= 0 || request.pricePerCredit() > 1_000_000_000L) {
            return ResponseEntity.badRequest().body("Đơn giá tín chỉ phải từ 1 đến 1.000.000.000 VND");
        }
        CreditPriceSetting setting = repository.findById("default").orElseGet(CreditPriceSetting::new);
        setting.setId("default");
        setting.setPricePerCredit(request.pricePerCredit());
        repository.save(setting);
        return ResponseEntity.ok(get());
    }
}
