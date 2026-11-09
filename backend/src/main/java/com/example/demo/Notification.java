package com.example.demo;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notifications")

public class Notification {
    @Id
    private String id;
    private String title;
    private String content;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String id, String title, String content) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}