package com.company.jobportal.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String headline;
    private String skills;
    private String resumeUrl;
    private String phone;
}
