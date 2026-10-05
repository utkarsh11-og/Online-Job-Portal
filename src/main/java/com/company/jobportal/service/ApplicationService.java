package com.company.jobportal.service;

import com.company.jobportal.dto.ApplicationRequest;
import com.company.jobportal.model.Application;
import com.company.jobportal.model.User;

import java.util.List;
import java.util.Optional;

public interface ApplicationService {
    Application applyForJob(User jobSeeker, ApplicationRequest request);
    Optional<Application> getApplicationById(Long id);
    List<Application> getApplicationsByJobSeeker(Long jobSeekerId);
    List<Application> getApplicationsByJobListing(Long jobListingId);
    List<Application> getApplicationsByEmployer(Long employerId);
    Application updateApplicationStatus(Long applicationId, String status, User currentUser);
    void deleteApplication(Long id);
    boolean hasApplied(Long jobListingId, Long jobSeekerId);
    List<Application> getAllApplications();
}
