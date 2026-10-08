package com.company.jobportal.controller;

import com.company.jobportal.model.LoginRequest;
import com.company.jobportal.model.User;
import com.company.jobportal.service.ActivityLogService;
import com.company.jobportal.service.AuthService;
import com.company.jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final UserService userService;
    private final ActivityLogService activityLogService;

    public AuthController(AuthService authService, UserService userService, ActivityLogService activityLogService) {
        this.authService = authService;
        this.userService = userService;
        this.activityLogService = activityLogService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (user.getRole() == null || user.getRole().trim().isEmpty()) {
                user.setRole("JOB_SEEKER");
            } else if ("ADMIN".equalsIgnoreCase(user.getRole().trim())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admin accounts cannot be registered publicly"));
            }
            User registeredUser = authService.registerUser(user);

            activityLogService.logActivity(registeredUser.getEmail(), registeredUser.getRole(),
                    "USER_REGISTERED", "Registered new " + registeredUser.getRole() + " account: " + registeredUser.getName());

            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            String token = authService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
            User user = userService.getUserByEmail(loginRequest.getEmail()).orElse(null);
            if (user != null) {
                activityLogService.logActivity(user.getEmail(), user.getRole(),
                        "USER_LOGIN", user.getName() + " logged in successfully");
            }
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", user != null ? user : Map.of("email", loginRequest.getEmail())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}