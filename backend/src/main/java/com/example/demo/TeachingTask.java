package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Cong viec cua Admin/Giang vien, tach biet voi thoi khoa bieu. */
@Document(collection="teaching_tasks")
public class TeachingTask {
 @Id private String id;
 private String title;
 private String description;
 private String dueDate; // YYYY-MM-DD
 private String courseId;
 private String className;
 private String ownerLecturerId; // null/empty = cong viec chung cua Admin
 private boolean completed;
 private String createdBy;
 private String createdAt;
 private String updatedAt;
 public String getId(){return id;}public void setId(String v){id=v;}
 public String getTitle(){return title;}public void setTitle(String v){title=v;}
 public String getDescription(){return description;}public void setDescription(String v){description=v;}
 public String getDueDate(){return dueDate;}public void setDueDate(String v){dueDate=v;}
 public String getCourseId(){return courseId;}public void setCourseId(String v){courseId=v;}
 public String getClassName(){return className;}public void setClassName(String v){className=v;}
 public String getOwnerLecturerId(){return ownerLecturerId;}public void setOwnerLecturerId(String v){ownerLecturerId=v;}
 public boolean isCompleted(){return completed;}public void setCompleted(boolean v){completed=v;}
 public String getCreatedBy(){return createdBy;}public void setCreatedBy(String v){createdBy=v;}
 public String getCreatedAt(){return createdAt;}public void setCreatedAt(String v){createdAt=v;}
 public String getUpdatedAt(){return updatedAt;}public void setUpdatedAt(String v){updatedAt=v;}
}
