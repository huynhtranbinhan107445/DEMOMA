package com.example.demo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection="grades")
public class Grade {
 @Id private String id;
 private String maSV;
 private String courseId;
 private Double processScore;
 private Double examScore;
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getMaSV(){return maSV;} public void setMaSV(String v){maSV=v;}
 public String getCourseId(){return courseId;} public void setCourseId(String v){courseId=v;}
 public Double getProcessScore(){return processScore;} public void setProcessScore(Double v){processScore=v;}
 public Double getExamScore(){return examScore;} public void setExamScore(Double v){examScore=v;}
}
