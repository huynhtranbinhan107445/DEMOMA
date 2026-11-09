package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.text.Normalizer;
import java.util.regex.Pattern;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // Hàm tạo email tự động: chỉ lấy TÊN (từ cuối) + maSV + @donga.edu.vn
    private String makeEmail(String hoTen, String maSV) {
        if (hoTen == null || maSV == null) return "";
        String[] parts = hoTen.trim().split("\\s+");
        String firstName = parts[parts.length - 1];
        
        String temp = Normalizer.normalize(firstName, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccent = pattern.matcher(temp).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
        
        return noAccent.toLowerCase() + maSV.toLowerCase() + "@donga.edu.vn";
    }

    @Bean
    CommandLineRunner initData(StudentRepository repository) {
        return args -> {
            // Kiểm tra và khởi tạo dữ liệu mẫu nếu DB MongoDB đang trống
            if (repository.count() == 0) {
                saveStudentWithAutoEmail(repository, "SV007", "Đặng Nhật G", "0966789012", "C2024A");
                saveStudentWithAutoEmail(repository, "SV004", "Phạm Minh D", "0933456789", "C2024A");
                saveStudentWithAutoEmail(repository, "SV005", "Hoàng Thị E", "0944567890", "C2024B");
                saveStudentWithAutoEmail(repository, "SV008", "Bùi Thảo H", "0977890123", "C2024B");
                saveStudentWithAutoEmail(repository, "SV001", "Nguyễn Văn A", "0901234567", "C2024A");
                saveStudentWithAutoEmail(repository, "SV009", "Ngô Quốc I", "0988901234", "C2024C");
                saveStudentWithAutoEmail(repository, "SV002", "Trần Thị B", "0912345678", "C2024B");
                System.out.println("==> Đã khởi tạo dữ liệu mẫu vào MongoDB thành công!");
            }
        };
    }

    private void saveStudentWithAutoEmail(StudentRepository repository, String maSV, String hoTen, String sdt, String lop) {
        String email = makeEmail(hoTen, maSV);
        
        Student student = new Student();
        student.setMaSV(maSV);
        student.setHoTen(hoTen);
        student.setEmail(email);
        student.setSoDienThoai(sdt);
        student.setLop(lop);
        student.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("ChangeMe_2026!")); // Gán mật khẩu mặc định khi tạo mới
        
        repository.save(student);
    }
}