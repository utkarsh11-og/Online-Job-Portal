package com.company.jobportal.dto;

import lombok.Data;

@Data
public class ApplicationRequest {
    private Long jobListingId;
    private String coverLetter;
    private String resumeUrl;
}
