package com.company.jobportal.controller;

import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.service.DashboardStatsService;
import com.company.jobportal.service.JobListingService;
import com.company.jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobListingController {

    private final JobListingService jobListingService;
    private final UserService userService;
    private final DashboardStatsService dashboardStatsService;

    public JobListingController(JobListingService jobListingService,
                                UserService userService,
                                DashboardStatsService dashboardStatsService) {
        this.jobListingService = jobListingService;
        this.userService = userService;
        this.dashboardStatsService = dashboardStatsService;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userService.getUserByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<JobListing>> getAllJobListings() {
        return ResponseEntity.ok(jobListingService.getAllJobListings());
    }

    @GetMapping("/public")
    public ResponseEntity<List<JobListing>> getPublicJobListings() {
        return ResponseEntity.ok(jobListingService.getApprovedJobListings());
    }

    @GetMapping("/search")
    public ResponseEntity<List<JobListing>> searchJobs(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "jobType", required = false) String jobType) {
        return ResponseEntity.ok(jobListingService.searchJobs(keyword, location, jobType));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<JobListing>> getRecommendations() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(jobListingService.getRecommendations(user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<JobListing>> getMyJobListings() {
        User employer = getAuthenticatedUser();
        if (employer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(jobListingService.getJobListingsByEmployerId(employer.getId()));
    }

    @GetMapping("/employer/stats")
    public ResponseEntity<Map<String, Object>> getEmployerStats() {
        User employer = getAuthenticatedUser();
        if (employer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(dashboardStatsService.getEmployerStats(employer.getId()));
    }

    @GetMapping("/seeker/stats")
    public ResponseEntity<Map<String, Object>> getJobSeekerStats() {
        User seeker = getAuthenticatedUser();
        if (seeker == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(dashboardStatsService.getJobSeekerStats(seeker.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobListing> getJobListingById(@PathVariable("id") Long id) {
        return jobListingService.getJobListingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<JobListing>> getJobListingsByEmployerId(@PathVariable("employerId") Long employerId) {
        return ResponseEntity.ok(jobListingService.getJobListingsByEmployerId(employerId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<JobListing>> getJobListingsByStatus(@PathVariable("status") String status) {
        return ResponseEntity.ok(jobListingService.getJobListingsByStatus(status));
    }

    @PostMapping
    public ResponseEntity<?> createJobListing(@RequestBody JobListing jobListing) {
        User employer = getAuthenticatedUser();
        if (employer != null) {
            jobListing.setEmployer(employer);
            if (jobListing.getCompanyName() == null || jobListing.getCompanyName().trim().isEmpty()) {
                jobListing.setCompanyName(employer.getName());
            }
        }
        JobListing createdJobListing = jobListingService.createJobListing(jobListing);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdJobListing);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobListing> updateJobListing(@PathVariable("id") Long id, @RequestBody JobListing jobListingDetails) {
        return jobListingService.getJobListingById(id)
                .map(jobListing -> {
                    jobListing.setTitle(jobListingDetails.getTitle());
                    jobListing.setDescription(jobListingDetails.getDescription());
                    jobListing.setRequirements(jobListingDetails.getRequirements());
                    jobListing.setSalary(jobListingDetails.getSalary());
                    if (jobListingDetails.getCompanyName() != null) {
                        jobListing.setCompanyName(jobListingDetails.getCompanyName());
                    }
                    if (jobListingDetails.getLocation() != null) {
                        jobListing.setLocation(jobListingDetails.getLocation());
                    }
                    if (jobListingDetails.getJobType() != null) {
                        jobListing.setJobType(jobListingDetails.getJobType());
                    }
                    if (jobListingDetails.getStatus() != null) {
                        jobListing.setStatus(jobListingDetails.getStatus());
                    }
                    JobListing updatedJobListing = jobListingService.updateJobListing(jobListing);
                    return ResponseEntity.ok(updatedJobListing);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobListing(@PathVariable("id") Long id) {
        return jobListingService.getJobListingById(id)
                .map(jobListing -> {
                    jobListingService.deleteJobListing(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}