package com.example.demo;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @PostMapping
    public Notification createNotification(@RequestBody Notification notification) {
        return notificationRepository.save(notification);
    }
}