package com.company.jobportal.service;

import com.company.jobportal.model.Application;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.repository.ApplicationRepository;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardStatsServiceImpl implements DashboardStatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobListingRepository jobListingRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Override
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        // User stats
        stats.put("totalUsers", userRepository.count());
        stats.put("totalEmployers", userRepository.countByRole("EMPLOYER"));
        stats.put("totalJobSeekers", userRepository.countByRole("JOB_SEEKER"));
        stats.put("totalAdmins", userRepository.countByRole("ADMIN"));

        // Job stats
        stats.put("totalJobs", jobListingRepository.count());
        stats.put("activeJobs", jobListingRepository.countByStatus("ACTIVE"));
        stats.put("pendingJobs", jobListingRepository.countByApprovalStatus("PENDING"));
        stats.put("approvedJobs", jobListingRepository.countByApprovalStatus("APPROVED"));
        stats.put("rejectedJobs", jobListingRepository.countByApprovalStatus("REJECTED"));

        // Application stats
        stats.put("totalApplications", applicationRepository.count());
        stats.put("pendingApplications", applicationRepository.countByStatus("PENDING"));
        stats.put("shortlistedApplications", applicationRepository.countByStatus("SHORTLISTED"));
        stats.put("acceptedApplications", applicationRepository.countByStatus("ACCEPTED"));
        stats.put("rejectedApplications", applicationRepository.countByStatus("REJECTED"));

        return stats;
    }

    @Override
    public Map<String, Object> getEmployerStats(Long employerId) {
        Map<String, Object> stats = new HashMap<>();

        List<JobListing> employerJobs = jobListingRepository.findByEmployerId(employerId);
        stats.put("totalJobs", employerJobs.size());
        stats.put("activeJobs", employerJobs.stream().filter(j -> "ACTIVE".equalsIgnoreCase(j.getStatus())).count());
        stats.put("filledJobs", employerJobs.stream().filter(j -> "FILLED".equalsIgnoreCase(j.getStatus())).count());
        stats.put("pendingApprovalJobs", employerJobs.stream().filter(j -> "PENDING".equalsIgnoreCase(j.getApprovalStatus())).count());

        List<Application> applications = applicationRepository.findByJobListingEmployerIdOrderByAppliedAtDesc(employerId);
        stats.put("totalApplications", applications.size());
        stats.put("pendingReview", applications.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count());
        stats.put("shortlisted", applications.stream().filter(a -> "SHORTLISTED".equalsIgnoreCase(a.getStatus())).count());
        stats.put("accepted", applications.stream().filter(a -> "ACCEPTED".equalsIgnoreCase(a.getStatus())).count());
        stats.put("rejected", applications.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getStatus())).count());

        // Jobs with applicant count
        Map<String, Long> applicantsPerJob = applications.stream()
                .collect(Collectors.groupingBy(a -> a.getJobListing().getTitle(), Collectors.counting()));
        stats.put("applicantsPerJob", applicantsPerJob);

        return stats;
    }

    @Override
    public Map<String, Object> getJobSeekerStats(Long jobSeekerId) {
        Map<String, Object> stats = new HashMap<>();

        List<Application> applications = applicationRepository.findByJobSeekerIdOrderByAppliedAtDesc(jobSeekerId);
        stats.put("totalApplied", applications.size());
        stats.put("pending", applications.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count());
        stats.put("shortlisted", applications.stream().filter(a -> "SHORTLISTED".equalsIgnoreCase(a.getStatus())).count());
        stats.put("accepted", applications.stream().filter(a -> "ACCEPTED".equalsIgnoreCase(a.getStatus())).count());
        stats.put("rejected", applications.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getStatus())).count());

        stats.put("availableJobs", jobListingRepository.countByStatus("ACTIVE"));

        return stats;
    }
}
