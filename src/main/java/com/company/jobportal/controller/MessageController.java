package com.company.jobportal.controller;

import com.company.jobportal.dto.MessageRequest;
import com.company.jobportal.model.Message;
import com.company.jobportal.model.User;
import com.company.jobportal.service.MessageService;
import com.company.jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    public MessageController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return userService.getUserByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        try {
            User sender = getCurrentUser();
            Message message = messageService.sendMessage(sender, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<Message>> getConversation(@PathVariable("otherUserId") Long otherUserId) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(messageService.getConversation(currentUser.getId(), otherUserId));
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<User>> getContacts() {
        User currentUser = getCurrentUser();
        List<User> contacts = messageService.getRecentContacts(currentUser.getId());
        return ResponseEntity.ok(contacts);
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<Message>> getInbox() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(messageService.getInbox(currentUser.getId()));
    }
}
