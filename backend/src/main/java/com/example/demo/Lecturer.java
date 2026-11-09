package com.example.demo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection="lecturers")
public class Lecturer {
 @Id private String id;
 private String code, fullName, email, department;
 private String password;
 private Long payPerCredit;
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
 public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getDepartment(){return department;} public void setDepartment(String v){department=v;}
 @JsonIgnore public String getPassword(){return password;} public void setPassword(String v){password=v;}
 public Long getPayPerCredit(){return payPerCredit;} public void setPayPerCredit(Long v){payPerCredit=v;}
}
