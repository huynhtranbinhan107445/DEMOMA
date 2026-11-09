package com.example.demo;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "forum_posts")
public class ForumPost {
    @Id public String id;
    public String title;
    public String content;
    public String author;
    public String authorRole;
    public Instant createdAt;
    public List<Comment> comments = new ArrayList<>();

    public static class Comment {
        public String id;
        public String author;
        public String content;
        public Instant createdAt;
    }
}
