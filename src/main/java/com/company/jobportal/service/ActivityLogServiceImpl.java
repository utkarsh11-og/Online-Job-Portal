package com.company.jobportal.service;

import com.company.jobportal.model.ActivityLog;
import com.company.jobportal.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import com.company.jobportal.websocket.ActivityWebSocketHandler;

import java.util.List;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {
    private final ActivityLogRepository activityLogRepository;
    private final ActivityWebSocketHandler activityWebSocketHandler;

    public ActivityLogServiceImpl(ActivityLogRepository activityLogRepository,
                                  ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityLogRepository = activityLogRepository;
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    @Override
    public void logActivity(String userEmail, String userRole, String action, String details) {
        ActivityLog log = new ActivityLog(userEmail, userRole, action, details);
        ActivityLog saved = activityLogRepository.save(log);

        // Broadcast to WebSocket clients
        activityWebSocketHandler.broadcastActivity(saved);
    }

    @Override
    public List<ActivityLog> getRecentActivities() {
        return activityLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
