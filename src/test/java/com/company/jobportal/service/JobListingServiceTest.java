package com.company.jobportal.service;

import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobListingServiceTest {

    @Mock
    private JobListingRepository jobListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemSettingService systemSettingService;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private JobListingServiceImpl jobListingService;

    private User employer;
    private JobListing jobListing;

    @BeforeEach
    void setUp() {
        employer = new User();
        employer.setId(10L);
        employer.setName("Acme Corp");
        employer.setEmail("hr@acme.com");
        employer.setRole("EMPLOYER");

        jobListing = new JobListing();
        jobListing.setId(100L);
        jobListing.setTitle("Senior Java Developer");
        jobListing.setDescription("Develop high-scale backend services");
        jobListing.setRequirements("Java 17, Spring Boot, MySQL");
        jobListing.setSalary(120000.0);
        jobListing.setLocation("Remote");
        jobListing.setJobType("Full-time");
        jobListing.setEmployer(employer);
    }

    @Test
    void createJobListing_AutoApproveTrue_SetsApproved() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(employer));
        when(systemSettingService.getSettingValue("AUTO_APPROVE_JOBS", "true")).thenReturn("true");
        when(jobListingRepository.save(any(JobListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JobListing created = jobListingService.createJobListing(jobListing);

        assertNotNull(created);
        assertEquals("APPROVED", created.getApprovalStatus());
        assertEquals("Acme Corp", created.getCompanyName());
        verify(activityLogService, times(1)).logActivity(eq("hr@acme.com"), eq("EMPLOYER"), eq("JOB_POSTED"), anyString());
    }

    @Test
    void createJobListing_AutoApproveFalse_SetsPending() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(employer));
        when(systemSettingService.getSettingValue("AUTO_APPROVE_JOBS", "true")).thenReturn("false");
        when(jobListingRepository.save(any(JobListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JobListing created = jobListingService.createJobListing(jobListing);

        assertNotNull(created);
        assertEquals("PENDING", created.getApprovalStatus());
    }

    @Test
    void getJobListingById_Found() {
        when(jobListingRepository.findById(100L)).thenReturn(Optional.of(jobListing));

        Optional<JobListing> result = jobListingService.getJobListingById(100L);

        assertTrue(result.isPresent());
        assertEquals("Senior Java Developer", result.get().getTitle());
    }

    @Test
    void updateApprovalStatus_ApprovesAndLogs() {
        when(jobListingRepository.findById(100L)).thenReturn(Optional.of(jobListing));
        when(jobListingRepository.save(any(JobListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JobListing updated = jobListingService.updateApprovalStatus(100L, "APPROVED");

        assertEquals("APPROVED", updated.getApprovalStatus());
        verify(activityLogService, times(1)).logActivity(eq("admin"), eq("ADMIN"), eq("JOB_APPROVAL_UPDATED"), anyString());
    }

    @Test
    void searchJobs_DelegatesToRepository() {
        when(jobListingRepository.searchJobs("Java", "Remote", "Full-time"))
                .thenReturn(Arrays.asList(jobListing));

        List<JobListing> results = jobListingService.searchJobs("Java", "Remote", "Full-time");

        assertEquals(1, results.size());
        assertEquals("Senior Java Developer", results.get(0).getTitle());
    }

    @Test
    void deleteJobListing_CallsRepositoryDelete() {
        doNothing().when(jobListingRepository).deleteById(100L);

        jobListingService.deleteJobListing(100L);

        verify(jobListingRepository, times(1)).deleteById(100L);
    }
}
