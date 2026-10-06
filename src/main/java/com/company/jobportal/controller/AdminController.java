package com.company.jobportal.controller;

import com.company.jobportal.model.ActivityLog;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.service.ActivityLogService;
import com.company.jobportal.service.DashboardStatsService;
import com.company.jobportal.service.JobListingService;
import com.company.jobportal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DashboardStatsService dashboardStatsService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private JobListingService jobListingService;

    @Autowired
    private UserService userService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(dashboardStatsService.getAdminStats());
    }

    @GetMapping({"/activities", "/activity-logs"})
    public ResponseEntity<List<ActivityLog>> getRecentActivities() {
        return ResponseEntity.ok(activityLogService.getRecentActivities());
    }

    @GetMapping("/jobs/pending")
    public ResponseEntity<List<JobListing>> getPendingJobs() {
        return ResponseEntity.ok(jobListingService.getPendingJobListings());
    }

    @PutMapping("/jobs/{id}/approval")
    public ResponseEntity<?> updateJobApproval(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String approvalStatus = body.get("approvalStatus");
        if (approvalStatus == null || approvalStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "approvalStatus is required"));
        }
        JobListing updated = jobListingService.updateApprovalStatus(id, approvalStatus);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (userService.getUserByEmail(user.getEmail().trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already registered"));
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            user.setPassword("password123");
        }
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("JOB_SEEKER");
        } else {
            user.setRole(user.getRole().trim().toUpperCase());
        }
        User created = userService.createUser(user);
        activityLogService.logActivity("admin@jobportal.com", "ADMIN", "USER_CREATED",
                "Created user account " + created.getEmail() + " (" + created.getRole() + ")");
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(Map.of(
                "message", "User created successfully",
                "user", created
        ));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @RequestBody User userDetails) {
        return userService.getUserById(id)
                .map(user -> {
                    if (userDetails.getName() != null && !userDetails.getName().trim().isEmpty()) {
                        user.setName(userDetails.getName().trim());
                    }
                    if (userDetails.getEmail() != null && !userDetails.getEmail().trim().isEmpty()) {
                        user.setEmail(userDetails.getEmail().trim());
                    }
                    if (userDetails.getRole() != null && !userDetails.getRole().trim().isEmpty()) {
                        user.setRole(userDetails.getRole().trim().toUpperCase());
                    }
                    if (userDetails.getHeadline() != null) {
                        user.setHeadline(userDetails.getHeadline().trim());
                    }
                    if (userDetails.getPhone() != null) {
                        user.setPhone(userDetails.getPhone().trim());
                    }
                    if (userDetails.getSkills() != null) {
                        user.setSkills(userDetails.getSkills().trim());
                    }
                    if (userDetails.getPassword() != null && !userDetails.getPassword().trim().isEmpty()) {
                        user.setPassword(userDetails.getPassword().trim());
                    }
                    User updated = userService.updateUser(user);
                    activityLogService.logActivity("admin@jobportal.com", "ADMIN", "USER_UPDATED",
                            "Updated user account " + updated.getEmail() + " (" + updated.getRole() + ")");
                    return ResponseEntity.ok(Map.of(
                            "message", "User updated successfully",
                            "user", updated
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long id) {
        userService.getUserById(id).ifPresent(u -> {
            activityLogService.logActivity("admin@jobportal.com", "ADMIN", "USER_DELETED",
                    "Deleted user account " + u.getEmail());
        });
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
