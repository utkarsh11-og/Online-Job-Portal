package com.company.jobportal.service;

import com.company.jobportal.model.ActivityLog;
import com.company.jobportal.model.Application;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.repository.ActivityLogRepository;
import com.company.jobportal.repository.ApplicationRepository;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardStatsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobListingRepository jobListingRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private DashboardStatsServiceImpl dashboardStatsService;

    @Test
    void getAdminStats_ReturnsComprehensiveMetrics() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole("EMPLOYER")).thenReturn(3L);
        when(userRepository.countByRole("JOB_SEEKER")).thenReturn(6L);
        when(userRepository.countByRole("ADMIN")).thenReturn(1L);

        when(activityLogRepository.countDistinctActiveUsersSince(any(LocalDateTime.class))).thenReturn(4L);
        when(activityLogRepository.countActivitiesSince(any(LocalDateTime.class))).thenReturn(15L);

        ActivityLog log1 = new ActivityLog();
        log1.setAction("USER_LOGIN");
        log1.setTimestamp(LocalDateTime.now());
        ActivityLog log2 = new ActivityLog();
        log2.setAction("APPLICATION_SUBMITTED");
        log2.setTimestamp(LocalDateTime.now());

        when(activityLogRepository.findByTimestampAfterOrderByTimestampDesc(any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(log1, log2));

        when(jobListingRepository.count()).thenReturn(8L);
        when(jobListingRepository.countByStatus("ACTIVE")).thenReturn(6L);
        when(jobListingRepository.countByApprovalStatus("PENDING")).thenReturn(2L);
        when(jobListingRepository.countByApprovalStatus("APPROVED")).thenReturn(5L);
        when(jobListingRepository.countByApprovalStatus("REJECTED")).thenReturn(1L);

        when(applicationRepository.count()).thenReturn(20L);
        when(applicationRepository.countByStatus("PENDING")).thenReturn(10L);
        when(applicationRepository.countByStatus("SHORTLISTED")).thenReturn(4L);
        when(applicationRepository.countByStatus("ACCEPTED")).thenReturn(2L);
        when(applicationRepository.countByStatus("REJECTED")).thenReturn(4L);

        Map<String, Object> stats = dashboardStatsService.getAdminStats();

        assertNotNull(stats);
        assertEquals(10L, stats.get("totalUsers"));
        assertEquals(4L, stats.get("dailyActiveUsers"));
        assertEquals(4L, stats.get("weeklyActiveUsers"));
        assertEquals(15L, stats.get("activitiesToday"));
        assertTrue(stats.containsKey("actionBreakdown"));
        assertTrue(stats.containsKey("activityTrends"));
        assertEquals(8L, stats.get("totalJobs"));
        assertEquals(20L, stats.get("totalApplications"));
    }

    @Test
    void getEmployerStats_ReturnsEmployerSpecificMetrics() {
        JobListing job1 = new JobListing();
        job1.setTitle("Backend Engineer");
        job1.setStatus("ACTIVE");
        job1.setApprovalStatus("APPROVED");

        when(jobListingRepository.findByEmployerId(5L)).thenReturn(Collections.singletonList(job1));

        Application app1 = new Application();
        app1.setStatus("SHORTLISTED");
        app1.setJobListing(job1);

        when(applicationRepository.findByJobListingEmployerIdOrderByAppliedAtDesc(5L))
                .thenReturn(Collections.singletonList(app1));

        Map<String, Object> stats = dashboardStatsService.getEmployerStats(5L);

        assertNotNull(stats);
        assertEquals(1, stats.get("totalJobs"));
        assertEquals(1L, stats.get("activeJobs"));
        assertEquals(1, stats.get("totalApplications"));
        assertEquals(1L, stats.get("shortlisted"));
        assertTrue(stats.containsKey("applicantsPerJob"));
    }

    @Test
    void getJobSeekerStats_ReturnsJobSeekerMetrics() {
        Application app1 = new Application();
        app1.setStatus("PENDING");

        when(applicationRepository.findByJobSeekerIdOrderByAppliedAtDesc(8L))
                .thenReturn(Collections.singletonList(app1));
        when(jobListingRepository.countByStatus("ACTIVE")).thenReturn(12L);

        Map<String, Object> stats = dashboardStatsService.getJobSeekerStats(8L);

        assertNotNull(stats);
        assertEquals(1, stats.get("totalApplied"));
        assertEquals(1L, stats.get("pending"));
        assertEquals(12L, stats.get("availableJobs"));
    }
}
