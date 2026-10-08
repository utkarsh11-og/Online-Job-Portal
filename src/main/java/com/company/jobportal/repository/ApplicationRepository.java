package com.company.jobportal.repository;

import com.company.jobportal.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobSeekerIdOrderByAppliedAtDesc(Long jobSeekerId);
    List<Application> findByJobListingIdOrderByAppliedAtDesc(Long jobListingId);
    List<Application> findByJobListingEmployerIdOrderByAppliedAtDesc(Long employerId);
    boolean existsByJobListingIdAndJobSeekerId(Long jobListingId, Long jobSeekerId);
    Optional<Application> findByJobListingIdAndJobSeekerId(Long jobListingId, Long jobSeekerId);
    long countByStatus(String status);
    long countByJobListingEmployerId(Long employerId);
}
