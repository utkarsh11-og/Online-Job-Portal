package com.company.jobportal.service;

import java.util.Map;

public interface DashboardStatsService {
    Map<String, Object> getAdminStats();
    Map<String, Object> getEmployerStats(Long employerId);
    Map<String, Object> getJobSeekerStats(Long jobSeekerId);
}
