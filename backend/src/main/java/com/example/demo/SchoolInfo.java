package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "school_info")
public class SchoolInfo {
    @Id public String id;
    public String name = "Trường Đại học Đông Á";
    public String tagline = "Cổng thông tin đào tạo và kết nối sinh viên";
    public String introduction = "Chào mừng đến với cổng thông tin đào tạo. Nhà trường có thể cập nhật giới thiệu chính thức tại mục Thông tin trường trong trang Admin.";
    public String training = "Thông tin chương trình đào tạo và các ngành học sẽ được nhà trường cập nhật.";
    public String studentSupport = "Thông tin hướng dẫn học tập, đăng ký học phần và hỗ trợ sinh viên sẽ được cập nhật.";
    public String address = "";
    public String email = "";
    public String phone = "";
    public String website = "";
}
