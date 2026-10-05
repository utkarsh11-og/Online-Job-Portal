package com.company.jobportal.service;

import com.company.jobportal.model.SystemSetting;
import java.util.List;
import java.util.Map;

public interface SystemSettingService {
    List<SystemSetting> getAllSettings();
    SystemSetting getSettingByKey(String key);
    String getSettingValue(String key, String defaultValue);
    SystemSetting updateSetting(String key, String value, String description);
    void updateSettings(Map<String, String> settings);
    void initDefaultSettings();
}
