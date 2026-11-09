package com.example.demo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection="enrollments")
public class Enrollment {
 @Id private String id;
 private String maSV, courseId, semester;
 // Snapshot at registration time; later price changes do not alter existing charges.
 private Long unitPrice, tuitionAmount;
 private Integer creditsAtRegistration;
 public Integer getCreditsAtRegistration(){return creditsAtRegistration;} public void setCreditsAtRegistration(Integer v){creditsAtRegistration=v;}
 public Long getUnitPrice(){return unitPrice;} public void setUnitPrice(Long v){unitPrice=v;}
 public Long getTuitionAmount(){return tuitionAmount;} public void setTuitionAmount(Long v){tuitionAmount=v;}
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getMaSV(){return maSV;} public void setMaSV(String v){maSV=v;}
 public String getCourseId(){return courseId;} public void setCourseId(String v){courseId=v;}
 public String getSemester(){return semester;} public void setSemester(String v){semester=v;}
}
