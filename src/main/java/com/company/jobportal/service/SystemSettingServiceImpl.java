package com.company.jobportal.service;

import com.company.jobportal.model.SystemSetting;
import com.company.jobportal.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private ActivityLogService activityLogService;

    @PostConstruct
    public void init() {
        initDefaultSettings();
    }

    @Override
    public void initDefaultSettings() {
        createIfMissing("SITE_NAME", "JobSphere Global Portal", "Portal brand name");
        createIfMissing("ADMIN_EMAIL", "admin@jobportal.com", "Primary administrator contact email");
        createIfMissing("AUTO_APPROVE_JOBS", "true", "Automatically approve employer job listings without admin review");
        createIfMissing("ALLOW_REGISTRATION", "true", "Allow new candidate and employer signups");
        createIfMissing("MAX_APPLICATIONS_PER_DAY", "20", "Limit of job applications per job seeker per day");
    }

    private void createIfMissing(String key, String defaultValue, String description) {
        if (!systemSettingRepository.existsBySettingKey(key)) {
            systemSettingRepository.save(new SystemSetting(key, defaultValue, description));
        }
    }

    @Override
    public List<SystemSetting> getAllSettings() {
        return systemSettingRepository.findAll();
    }

    @Override
    public SystemSetting getSettingByKey(String key) {
        return systemSettingRepository.findBySettingKey(key)
                .orElse(null);
    }

    @Override
    public String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    public SystemSetting updateSetting(String key, String value, String description) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElse(new SystemSetting(key, value, description));
        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }
        SystemSetting saved = systemSettingRepository.save(setting);
        activityLogService.logActivity("admin", "ADMIN", "SETTINGS_UPDATED", "Updated setting " + key + " = " + value);
        return saved;
    }

    @Override
    public void updateSettings(Map<String, String> settings) {
        settings.forEach((key, val) -> {
            systemSettingRepository.findBySettingKey(key).ifPresent(s -> {
                s.setSettingValue(val);
                systemSettingRepository.save(s);
            });
        });
        activityLogService.logActivity("admin", "ADMIN", "SETTINGS_UPDATED", "Bulk updated " + settings.size() + " settings");
    }
}
