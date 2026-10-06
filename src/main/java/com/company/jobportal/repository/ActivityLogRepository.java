package com.company.jobportal.repository;

import com.company.jobportal.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop50ByOrderByTimestampDesc();

    List<ActivityLog> findByTimestampAfterOrderByTimestampDesc(LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT a.userEmail) FROM ActivityLog a WHERE a.timestamp >= :since AND a.userEmail IS NOT NULL")
    long countDistinctActiveUsersSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.timestamp >= :since")
    long countActivitiesSince(@Param("since") LocalDateTime since);
}
