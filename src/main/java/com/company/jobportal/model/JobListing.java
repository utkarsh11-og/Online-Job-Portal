package com.company.jobportal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "job_listings")
public class JobListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(nullable = false, length = 2000)
    private String requirements;

    @Column(nullable = false)
    private Double salary;

    private String companyName;

    private String location; // e.g. New York, Remote

    private String jobType;  // Full-time, Part-time, Contract, Remote

    @ManyToOne
    @JoinColumn(name = "employer_id", nullable = false)
    private User employer;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, FILLED

    @Column(nullable = false)
    private String approvalStatus = "APPROVED"; // PENDING, APPROVED, REJECTED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "ACTIVE";
        if (approvalStatus == null) approvalStatus = "APPROVED";
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}