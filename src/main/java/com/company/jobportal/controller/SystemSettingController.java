package com.company.jobportal.controller;

import com.company.jobportal.model.SystemSetting;
import com.company.jobportal.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SystemSettingController {

    @Autowired
    private SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingService.getAllSettings());
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getSettingByKey(@PathVariable("key") String key) {
        SystemSetting setting = systemSettingService.getSettingByKey(key);
        if (setting == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(setting);
    }

    @PutMapping("/{key}")
    public ResponseEntity<?> updateSetting(@PathVariable("key") String key, @RequestBody Map<String, String> body) {
        String value = body.get("value");
        String description = body.get("description");
        if (value == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Setting value is required"));
        }
        SystemSetting updated = systemSettingService.updateSetting(key, value, description);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> updateBulkSettings(@RequestBody Map<String, String> settings) {
        systemSettingService.updateSettings(settings);
        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }
}
