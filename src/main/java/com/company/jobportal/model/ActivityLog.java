package com.company.jobportal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    private String userRole;

    @Column(nullable = false)
    private String action; // e.g. "USER_REGISTERED", "JOB_POSTED", "APPLICATION_SUBMITTED", "STATUS_UPDATED"

    @Column(nullable = false, length = 1000)
    private String details;

    private LocalDateTime timestamp;

    public ActivityLog(String userEmail, String userRole, String action, String details) {
        this.userEmail = userEmail;
        this.userRole = userRole;
        this.action = action;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
