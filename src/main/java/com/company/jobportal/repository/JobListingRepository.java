package com.company.jobportal.repository;

import com.company.jobportal.model.JobListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface JobListingRepository extends JpaRepository<JobListing, Long> {
    List<JobListing> findByEmployerId(Long employerId);
    List<JobListing> findByEmployerIdOrderByCreatedAtDesc(Long employerId);
    List<JobListing> findByStatus(String status);
    List<JobListing> findByApprovalStatus(String approvalStatus);
    List<JobListing> findByStatusAndApprovalStatus(String status, String approvalStatus);

    @Query("SELECT j FROM JobListing j WHERE j.status = 'ACTIVE' AND j.approvalStatus = 'APPROVED' " +
           "AND (:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(j.requirements) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(COALESCE(j.companyName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:location IS NULL OR LOWER(COALESCE(j.location, '')) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:jobType IS NULL OR LOWER(COALESCE(j.jobType, '')) LIKE LOWER(CONCAT('%', :jobType, '%'))) " +
           "ORDER BY j.createdAt DESC")
    List<JobListing> searchJobs(@Param("keyword") String keyword,
                                @Param("location") String location,
                                @Param("jobType") String jobType);

    long countByApprovalStatus(String approvalStatus);
    long countByStatus(String status);
    long countByEmployerId(Long employerId);
}