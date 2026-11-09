package com.example.demo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection="exams")
public class Exam {
 @Id private String id;
 private String courseId;
 private String date;
 private String startTime;
 private String room;
 private String semester;
 public String getId(){return id;} public void setId(String v){id=v;}
 public String getCourseId(){return courseId;} public void setCourseId(String v){courseId=v;}
 public String getDate(){return date;} public void setDate(String v){date=v;}
 public String getStartTime(){return startTime;} public void setStartTime(String v){startTime=v;}
 public String getRoom(){return room;} public void setRoom(String v){room=v;}
 public String getSemester(){return semester;} public void setSemester(String v){semester=v;}
}
