package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {

    // Thêm hàm tìm kiếm sinh viên theo email
    Optional<Student> findByEmail(String email);
    Optional<Student> findByMaSVIgnoreCase(String maSV);
    boolean existsByMaSVIgnoreCase(String maSV);
    boolean existsByEmailIgnoreCase(String email);

    // Hàm tìm kiếm tổng hợp đã có
    List<Student> findByMaSVContainingIgnoreCaseOrHoTenContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String maSV, String hoTen, String email);
}