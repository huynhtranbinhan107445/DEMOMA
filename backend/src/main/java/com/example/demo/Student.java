package com.example.demo;

import org.springframework.data.annotation.Id;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "students")
public class Student {

    @Id
    private String id;
    private String maSV;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String lop;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    public Student() {}

    // --- GETTER & SETTER CHO PASSWORD ---
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // --- CÁC GETTER & SETTER KHÁC GIỮ NGUYÊN ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMaSV() { return maSV; }
    public void setMaSV(String maSV) { this.maSV = maSV; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }

    public String getLop() { return lop; }
    public void setLop(String lop) { this.lop = lop; }
}