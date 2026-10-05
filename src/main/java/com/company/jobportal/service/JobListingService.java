package com.company.jobportal.service;

import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;

import java.util.List;
import java.util.Optional;

public interface JobListingService {
    JobListing createJobListing(JobListing jobListing);
    Optional<JobListing> getJobListingById(Long id);
    List<JobListing> getAllJobListings();
    List<JobListing> getJobListingsByEmployerId(Long employerId);
    List<JobListing> getJobListingsByStatus(String status);
    List<JobListing> getApprovedJobListings();
    List<JobListing> getPendingJobListings();
    List<JobListing> searchJobs(String keyword, String location, String jobType);
    List<JobListing> getRecommendations(User jobSeeker);
    JobListing updateApprovalStatus(Long id, String approvalStatus);
    JobListing updateJobListing(JobListing jobListing);
    void deleteJobListing(Long id);
}