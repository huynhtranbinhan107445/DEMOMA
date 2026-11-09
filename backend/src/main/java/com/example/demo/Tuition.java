package com.example.demo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection="tuitions")
public class Tuition {
 @Id private String id;
 private String maSV;
 private String semester;
 private Long amount;
 private Long paidAmount;
 private String status;
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getMaSV(){return maSV;} public void setMaSV(String v){maSV=v;}
 public String getSemester(){return semester;} public void setSemester(String v){semester=v;}
 public Long getAmount(){return amount;} public void setAmount(Long v){amount=v;}
 public Long getPaidAmount(){return paidAmount;} public void setPaidAmount(Long v){paidAmount=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
}
