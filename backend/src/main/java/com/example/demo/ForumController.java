package com.example.demo;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/forum/posts")
public class ForumController {
    private final ForumPostRepository repository;
    private final StudentRepository students;
    private final LecturerRepository lecturers;
    public ForumController(ForumPostRepository repository, StudentRepository students, LecturerRepository lecturers) {
        this.repository = repository;
        this.students = students;
        this.lecturers = lecturers;
    }

    private String displayName(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return "Quản trị viên";
        if(auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_LECTURER")))
            return lecturers.findByEmailIgnoreCase(auth.getName()).map(Lecturer::getFullName).orElse("Giảng viên");
        return students.findByEmail(auth.getName())
            .map(s -> s.getHoTen() == null || s.getHoTen().isBlank() ? "Sinh viên" : s.getHoTen())
            .orElse("Sinh viên");
    }

    @GetMapping
    public List<ForumPost> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().limit(100).toList();
    }

    @PostMapping
    public ForumPost create(@RequestBody Map<String, String> body, Authentication auth) {
        ForumPost post = new ForumPost();
        post.title = required(body.get("title"), 120, "Tiêu đề");
        post.content = required(body.get("content"), 4000, "Nội dung");
        post.author = displayName(auth);
        post.authorRole = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) ? "ADMIN" :
            auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_LECTURER")) ? "LECTURER" : "STUDENT";
        post.createdAt = Instant.now();
        return repository.save(post);
    }

    @PostMapping("/{id}/comments")
    public ForumPost comment(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        ForumPost post = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết"));
        if (post.comments == null) post.comments = new java.util.ArrayList<>();
        if (post.comments.size() >= 200) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bài viết đã đạt giới hạn bình luận");
        ForumPost.Comment comment = new ForumPost.Comment();
        comment.id = UUID.randomUUID().toString();
        comment.author = displayName(auth);
        comment.content = required(body.get("content"), 800, "Bình luận");
        comment.createdAt = Instant.now();
        post.comments.add(comment);
        return repository.save(post);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết");
        repository.deleteById(id);
    }

    private String required(String value, int max, String field) {
        if (value == null || value.isBlank() || value.trim().length() > max)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " phải có từ 1 đến " + max + " ký tự");
        return value.trim();
    }
}
