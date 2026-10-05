package com.company.jobportal.service;

import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JobListingServiceImpl implements JobListingService {

    @Autowired
    private JobListingRepository jobListingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemSettingService systemSettingService;

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public JobListing createJobListing(JobListing jobListing) {
        if (jobListing.getEmployer() != null && jobListing.getEmployer().getId() != null) {
            User employer = userRepository.findById(jobListing.getEmployer().getId())
                    .orElseThrow(() -> new RuntimeException("Employer not found"));
            jobListing.setEmployer(employer);
            if (jobListing.getCompanyName() == null || jobListing.getCompanyName().trim().isEmpty()) {
                jobListing.setCompanyName(employer.getName());
            }
        }

        // Check if auto-approval is enabled
        String autoApprove = systemSettingService.getSettingValue("AUTO_APPROVE_JOBS", "true");
        if ("true".equalsIgnoreCase(autoApprove)) {
            jobListing.setApprovalStatus("APPROVED");
        } else {
            jobListing.setApprovalStatus("PENDING");
        }

        JobListing saved = jobListingRepository.save(jobListing);
        String employerEmail = saved.getEmployer() != null ? saved.getEmployer().getEmail() : "employer";
        activityLogService.logActivity(employerEmail, "EMPLOYER", "JOB_POSTED",
                "Created job listing: " + saved.getTitle() + " (Approval: " + saved.getApprovalStatus() + ")");
        return saved;
    }

    @Override
    public Optional<JobListing> getJobListingById(Long id) {
        return jobListingRepository.findById(id);
    }

    @Override
    public List<JobListing> getAllJobListings() {
        return jobListingRepository.findAll();
    }

    @Override
    public List<JobListing> getJobListingsByEmployerId(Long employerId) {
        return jobListingRepository.findByEmployerIdOrderByCreatedAtDesc(employerId);
    }

    @Override
    public List<JobListing> getJobListingsByStatus(String status) {
        return jobListingRepository.findByStatus(status);
    }

    @Override
    public List<JobListing> getApprovedJobListings() {
        return jobListingRepository.findByStatusAndApprovalStatus("ACTIVE", "APPROVED");
    }

    @Override
    public List<JobListing> getPendingJobListings() {
        return jobListingRepository.findByApprovalStatus("PENDING");
    }

    @Override
    public List<JobListing> searchJobs(String keyword, String location, String jobType) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String loc = (location != null && !location.trim().isEmpty()) ? location.trim() : null;
        String jt = (jobType != null && !jobType.trim().isEmpty()) ? jobType.trim() : null;
        return jobListingRepository.searchJobs(kw, loc, jt);
    }

    @Override
    public List<JobListing> getRecommendations(User jobSeeker) {
        List<JobListing> activeJobs = getApprovedJobListings();
        if (jobSeeker == null || ((jobSeeker.getSkills() == null || jobSeeker.getSkills().trim().isEmpty())
                && (jobSeeker.getHeadline() == null || jobSeeker.getHeadline().trim().isEmpty()))) {
            return activeJobs.stream().limit(6).collect(Collectors.toList());
        }

        List<String> userKeywords = new ArrayList<>();
        if (jobSeeker.getSkills() != null) {
            Arrays.stream(jobSeeker.getSkills().split("[,;\\s]+"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toLowerCase)
                    .forEach(userKeywords::add);
        }
        if (jobSeeker.getHeadline() != null) {
            Arrays.stream(jobSeeker.getHeadline().split("[,;\\s]+"))
                    .map(String::trim)
                    .filter(s -> s.length() > 2)
                    .map(String::toLowerCase)
                    .forEach(userKeywords::add);
        }

        // Rank jobs based on keyword match in title, requirements, description
        return activeJobs.stream()
                .sorted((j1, j2) -> {
                    long score1 = countMatches(j1, userKeywords);
                    long score2 = countMatches(j2, userKeywords);
                    return Long.compare(score2, score1);
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    private long countMatches(JobListing job, List<String> keywords) {
        String text = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements()).toLowerCase();
        return keywords.stream().filter(text::contains).count();
    }

    @Override
    public JobListing updateApprovalStatus(Long id, String approvalStatus) {
        JobListing job = jobListingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with ID: " + id));
        job.setApprovalStatus(approvalStatus.toUpperCase());
        JobListing updated = jobListingRepository.save(job);
        activityLogService.logActivity("admin", "ADMIN", "JOB_APPROVAL_UPDATED",
                "Job '" + job.getTitle() + "' was " + approvalStatus.toLowerCase());
        return updated;
    }

    @Override
    public JobListing updateJobListing(JobListing jobListing) {
        return jobListingRepository.save(jobListing);
    }

    @Override
    public void deleteJobListing(Long id) {
        jobListingRepository.deleteById(id);
    }
}