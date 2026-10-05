package com.company.jobportal.controller;

import com.company.jobportal.dto.ApplicationRequest;
import com.company.jobportal.model.Application;
import com.company.jobportal.model.User;
import com.company.jobportal.service.ApplicationService;
import com.company.jobportal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return userService.getUserByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<?> applyForJob(@RequestBody ApplicationRequest request) {
        try {
            User currentUser = getCurrentUser();
            Application application = applicationService.applyForJob(currentUser, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(application);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/seeker")
    public ResponseEntity<List<Application>> getMyApplications() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(applicationService.getApplicationsByJobSeeker(currentUser.getId()));
    }

    @GetMapping("/employer")
    public ResponseEntity<List<Application>> getEmployerApplications() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(applicationService.getApplicationsByEmployer(currentUser.getId()));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<Application>> getApplicationsByJob(@PathVariable("jobId") Long jobId) {
        return ResponseEntity.ok(applicationService.getApplicationsByJobListing(jobId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(@PathVariable("id") Long id) {
        return applicationService.getApplicationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        try {
            User currentUser = getCurrentUser();
            String status = body.get("status");
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            Application updated = applicationService.updateApplicationStatus(id, status, currentUser);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check/{jobId}")
    public ResponseEntity<Map<String, Boolean>> checkApplicationStatus(@PathVariable("jobId") Long jobId) {
        try {
            User currentUser = getCurrentUser();
            boolean applied = applicationService.hasApplied(jobId, currentUser.getId());
            return ResponseEntity.ok(Map.of("applied", applied));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("applied", false));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable("id") Long id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.ok().build();
    }
}
