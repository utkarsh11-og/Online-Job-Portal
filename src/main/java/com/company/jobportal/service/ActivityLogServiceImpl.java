package com.company.jobportal.service;

import com.company.jobportal.model.ActivityLog;
import com.company.jobportal.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Override
    public void logActivity(String userEmail, String userRole, String action, String details) {
        ActivityLog log = new ActivityLog(userEmail, userRole, action, details);
        activityLogRepository.save(log);
    }

    @Override
    public List<ActivityLog> getRecentActivities() {
        return activityLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
