package com.company.jobportal.service;

import com.company.jobportal.model.ActivityLog;
import java.util.List;

public interface ActivityLogService {
    void logActivity(String userEmail, String userRole, String action, String details);
    List<ActivityLog> getRecentActivities();
}
