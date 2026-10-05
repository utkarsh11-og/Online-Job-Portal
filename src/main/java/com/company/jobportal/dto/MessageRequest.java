package com.company.jobportal.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private Long receiverId;
    private Long jobListingId;
    private String content;
}
