package com.company.jobportal.service;

import com.company.jobportal.dto.ApplicationRequest;
import com.company.jobportal.model.Application;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.ApplicationRepository;
import com.company.jobportal.repository.JobListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobListingRepository jobListingRepository;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private ApplicationServiceImpl applicationService;

    private User jobSeeker;
    private User employer;
    private JobListing jobListing;

    @BeforeEach
    void setUp() {
        jobSeeker = new User();
        jobSeeker.setId(20L);
        jobSeeker.setName("John Seeker");
        jobSeeker.setEmail("john@seeker.com");
        jobSeeker.setRole("JOB_SEEKER");
        jobSeeker.setResumeUrl("http://example.com/resume.pdf");

        employer = new User();
        employer.setId(10L);
        employer.setName("Tech Corp");
        employer.setEmail("tech@corp.com");
        employer.setRole("EMPLOYER");

        jobListing = new JobListing();
        jobListing.setId(50L);
        jobListing.setTitle("Frontend Engineer");
        jobListing.setEmployer(employer);
    }

    @Test
    void applyForJob_Success() {
        ApplicationRequest req = new ApplicationRequest();
        req.setJobListingId(50L);
        req.setCoverLetter("I am an experienced frontend developer.");

        when(jobListingRepository.findById(50L)).thenReturn(Optional.of(jobListing));
        when(applicationRepository.existsByJobListingIdAndJobSeekerId(50L, 20L)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Application created = applicationService.applyForJob(jobSeeker, req);

        assertNotNull(created);
        assertEquals("PENDING", created.getStatus());
        assertEquals(jobSeeker, created.getJobSeeker());
        assertEquals(jobListing, created.getJobListing());
        assertEquals("http://example.com/resume.pdf", created.getResumeUrl());
        verify(activityLogService, times(1)).logActivity(eq("john@seeker.com"), eq("JOB_SEEKER"), eq("APPLICATION_SUBMITTED"), anyString());
    }

    @Test
    void applyForJob_AlreadyApplied_ThrowsException() {
        ApplicationRequest req = new ApplicationRequest();
        req.setJobListingId(50L);

        when(jobListingRepository.findById(50L)).thenReturn(Optional.of(jobListing));
        when(applicationRepository.existsByJobListingIdAndJobSeekerId(50L, 20L)).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            applicationService.applyForJob(jobSeeker, req);
        });

        assertTrue(ex.getMessage().contains("already applied"));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void applyForJob_JobNotFound_ThrowsException() {
        ApplicationRequest req = new ApplicationRequest();
        req.setJobListingId(999L);

        when(jobListingRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            applicationService.applyForJob(jobSeeker, req);
        });

        assertTrue(ex.getMessage().contains("Job listing not found"));
    }

    @Test
    void updateApplicationStatus_Success() {
        Application application = new Application();
        application.setId(101L);
        application.setJobSeeker(jobSeeker);
        application.setJobListing(jobListing);
        application.setStatus("PENDING");

        when(applicationRepository.findById(101L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Application updated = applicationService.updateApplicationStatus(101L, "SHORTLISTED", employer);

        assertEquals("SHORTLISTED", updated.getStatus());
        verify(activityLogService, times(1)).logActivity(eq("tech@corp.com"), eq("EMPLOYER"), eq("APPLICATION_STATUS_UPDATED"), anyString());
    }

    @Test
    void hasApplied_ReturnsTrueWhenExists() {
        when(applicationRepository.existsByJobListingIdAndJobSeekerId(50L, 20L)).thenReturn(true);

        boolean applied = applicationService.hasApplied(50L, 20L);

        assertTrue(applied);
    }
}
