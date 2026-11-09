package com.example.demo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection="courses")
public class Course {
 @Id private String id;
 private String code, name, department, semester;
 private Integer credits;
 private String lecturerId;
 public String getLecturerId(){return lecturerId;} public void setLecturerId(String v){lecturerId=v;}
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDepartment(){return department;} public void setDepartment(String v){department=v;}
 public String getSemester(){return semester;} public void setSemester(String v){semester=v;}
 public Integer getCredits(){return credits;} public void setCredits(Integer v){credits=v;}
}
