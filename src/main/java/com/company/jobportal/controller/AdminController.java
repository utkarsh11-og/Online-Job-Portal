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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
