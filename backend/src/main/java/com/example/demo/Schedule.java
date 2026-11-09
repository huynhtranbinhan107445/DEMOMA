package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "schedules")
public class Schedule {

    @Id
    private String id;
    private String lop;         // Tên lớp (VD: IT24A, C2024A)
    private String tenMonHoc;   // Tên môn học
    private String thu;         // Thứ trong tuần (Thứ 2, Thứ 3,...)
    private String caHoc;       // Sáng / Chiều / Ca 1 (7h30-9h50)...
    private String phongHoc;    // Phòng học (VD: A302)
    private String giangVien;   // Tên giảng viên
    private String courseId;     // Liên kết học phần để thống kê số lớp
    private String lecturerId;   // Liên kết giảng viên đã phân công
    private Integer tietBatDau; // Tiết đầu tiên trong buổi học
    private Integer soTiet;      // Tổng số tiết trong buổi
    private String ngayBatDau;  // YYYY-MM-DD, tùy chọn
    private String ngayKetThuc; // YYYY-MM-DD, tùy chọn
    private String planId; // Nhóm các thứ học thuộc cùng một kế hoạch tự động
    private String classGroupId; // Nhóm các lớp học cùng một buổi thủ công

    public Schedule() {}

    public Schedule(String lop, String tenMonHoc, String thu, String caHoc, String phongHoc, String giangVien) {
        this.lop = lop;
        this.tenMonHoc = tenMonHoc;
        this.thu = thu;
        this.caHoc = caHoc;
        this.phongHoc = phongHoc;
        this.giangVien = giangVien;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLop() { return lop; }
    public void setLop(String lop) { this.lop = lop; }

    public String getTenMonHoc() { return tenMonHoc; }
    public void setTenMonHoc(String tenMonHoc) { this.tenMonHoc = tenMonHoc; }

    public String getThu() { return thu; }
    public void setThu(String thu) { this.thu = thu; }

    public String getCaHoc() { return caHoc; }
    public void setCaHoc(String caHoc) { this.caHoc = caHoc; }

    public String getPhongHoc() { return phongHoc; }
    public void setPhongHoc(String phongHoc) { this.phongHoc = phongHoc; }

    public String getCourseId(){return courseId;}
    public void setCourseId(String v){courseId=v;}
    public String getLecturerId(){return lecturerId;}
    public void setLecturerId(String v){lecturerId=v;}
    public Integer getTietBatDau() { return tietBatDau; }
    public void setTietBatDau(Integer value) { tietBatDau = value; }
    public Integer getSoTiet() { return soTiet; }
    public void setSoTiet(Integer value) { soTiet = value; }
    public String getNgayBatDau() { return ngayBatDau; }
    public void setNgayBatDau(String value) { ngayBatDau = value; }
    public String getNgayKetThuc() { return ngayKetThuc; }
    public void setNgayKetThuc(String value) { ngayKetThuc = value; }
    public String getPlanId() { return planId; }
    public void setPlanId(String value) { planId = value; }
    public String getClassGroupId() { return classGroupId; }
    public void setClassGroupId(String value) { classGroupId = value; }
    public String getGiangVien() { return giangVien; }
    public void setGiangVien(String giangVien) { this.giangVien = giangVien; }
}