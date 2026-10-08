package com.company.jobportal.service;

import com.company.jobportal.dto.ApplicationRequest;
import com.company.jobportal.model.Application;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.ApplicationRepository;
import com.company.jobportal.repository.JobListingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicationServiceImpl implements ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final JobListingRepository jobListingRepository;
    private final ActivityLogService activityLogService;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository,
                                  JobListingRepository jobListingRepository,
                                  ActivityLogService activityLogService) {
        this.applicationRepository = applicationRepository;
        this.jobListingRepository = jobListingRepository;
        this.activityLogService = activityLogService;
    }

    @Override
    public Application applyForJob(User jobSeeker, ApplicationRequest request) {
        JobListing jobListing = jobListingRepository.findById(request.getJobListingId())
                .orElseThrow(() -> new RuntimeException("Job listing not found with ID: " + request.getJobListingId()));

        if (applicationRepository.existsByJobListingIdAndJobSeekerId(jobListing.getId(), jobSeeker.getId())) {
            throw new RuntimeException("You have already applied for this position!");
        }

        Application application = new Application();
        application.setJobSeeker(jobSeeker);
        application.setJobListing(jobListing);
        application.setCoverLetter(request.getCoverLetter());
        
        // Use resume from request or fall back to user's profile resume
        String resume = (request.getResumeUrl() != null && !request.getResumeUrl().trim().isEmpty())
                ? request.getResumeUrl()
                : jobSeeker.getResumeUrl();
        application.setResumeUrl(resume);
        application.setStatus("PENDING");

        Application saved = applicationRepository.save(application);
        activityLogService.logActivity(jobSeeker.getEmail(), jobSeeker.getRole(),
                "APPLICATION_SUBMITTED", "Applied to '" + jobListing.getTitle() + "' at " +
                        (jobListing.getCompanyName() != null ? jobListing.getCompanyName() : jobListing.getEmployer().getName()));
        return saved;
    }

    @Override
    public Optional<Application> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    @Override
    public List<Application> getApplicationsByJobSeeker(Long jobSeekerId) {
        return applicationRepository.findByJobSeekerIdOrderByAppliedAtDesc(jobSeekerId);
    }

    @Override
    public List<Application> getApplicationsByJobListing(Long jobListingId) {
        return applicationRepository.findByJobListingIdOrderByAppliedAtDesc(jobListingId);
    }

    @Override
    public List<Application> getApplicationsByEmployer(Long employerId) {
        return applicationRepository.findByJobListingEmployerIdOrderByAppliedAtDesc(employerId);
    }

    @Override
    public Application updateApplicationStatus(Long applicationId, String status, User currentUser) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + applicationId));

        application.setStatus(status.toUpperCase());
        Application updated = applicationRepository.save(application);

        activityLogService.logActivity(currentUser.getEmail(), currentUser.getRole(),
                "APPLICATION_STATUS_UPDATED", "Status changed to " + status + " for applicant " + application.getJobSeeker().getName());
        return updated;
    }

    @Override
    public void deleteApplication(Long id) {
        applicationRepository.deleteById(id);
    }

    @Override
    public boolean hasApplied(Long jobListingId, Long jobSeekerId) {
        return applicationRepository.existsByJobListingIdAndJobSeekerId(jobListingId, jobSeekerId);
    }

    @Override
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }
}
