# Enhanced User Engagement Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement enhanced user engagement metrics including Daily Active Users (DAU), Weekly Active Users (WAU), average session duration, login frequency distribution, and feature usage percentages for the Admin Dashboard.

**Architecture:** Extend the existing activity logging system to capture login/logout events with timestamps, create a UserActivityService to calculate engagement metrics, and extend the DashboardStatsService to include these metrics in admin stats.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Spring Data JPA, Hibernate, MySQL/PostgreSQL, ActivityLog entity, DashboardStatsService

**Spec:** docs/superpowers/plans/job_remaining_features.md (section 2. Enhanced User Engagement Metrics)

## Global Constraints

- Follow existing code patterns and naming conventions in the codebase
- Maintain backward compatibility with existing ActivityLog functionality
- Use proper error handling and logging
- Write unit tests for new functionality
- Follow REST API design principles for any new endpoints
- Keep controllers thin; move business logic to services
- Use DTOs to avoid exposing internal entities where appropriate
- Secure endpoints with appropriate authentication/authorization
- Follow Java naming conventions and code style

---
### Task 1: Extend ActivityLog entity to include session data

**Files:**
- Modify: `src/main/java/com/company/jobportal/model/ActivityLog.java`

**Interfaces:**
- Consumes: 
- Produces: Extended ActivityLog entity with session tracking fields

- [ ] **Step 1: Write the failing test**
```java
// Test that ActivityLog can store session data
@Test
public void testActivityLogWithSessionData() {
    ActivityLog log = new ActivityLog();
    log.setSessionId("test-session-123");
    log.setLoginTimestamp(LocalDateTime.now());
    log.setLogoutTimestamp(LocalDateTime.now().plusMinutes(30));
    
    assertEquals("test-session-123", log.getSessionId());
    assertNotNull(log.getLoginTimestamp());
    assertNotNull(log.getLogoutTimestamp());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=ActivityLogTest::testActivityLogWithSessionData`
Expected: FAIL with "cannot find symbol" for session fields

- [ ] **Step 3: Write minimal implementation**
```java
// Add to ActivityLog.java
private String sessionId;
private LocalDateTime loginTimestamp;
private LocalDateTime logoutTimestamp;

// Add getters and setters
public String getSessionId() { return sessionId; }
public void setSessionId(String sessionId) { this.sessionId = sessionId; }
public LocalDateTime getLoginTimestamp() { return loginTimestamp; }
public void setLoginTimestamp(LocalDateTime loginTimestamp) { this.loginTimestamp = loginTimestamp; }
public LocalDateTime getLogoutTimestamp() { return logoutTimestamp; }
public void setLogoutTimestamp(LocalDateTime logoutTimestamp) { this.logoutTimestamp = logoutTimestamp; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=ActivityLogTest::testActivityLogWithSessionData`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/company/jobportal/model/ActivityLog.java
git commit -m "feat: extend ActivityLog entity with session data fields"
```

### Task 2: Add repository methods for querying activity trends

**Files:**
- Modify: `src/main/java/com/company/jobportal/repository/ActivityLogRepository.java`

**Interfaces:**
- Consumes: Extended ActivityLog entity
- Produces: Repository methods for querying login/logout events and session data

- [ ] **Step 1: Write the failing test**
```java
// Test that repository can query login events
@Test
public void testRepositoryCanQueryLoginEvents() {
    // Given
    LocalDateTime startDate = LocalDateTime.now().minusDays(1);
    LocalDateTime endDate = LocalDateTime.now();
    
    // When
    List<ActivityLog> loginEvents = activityLogRepository.findByActionAndTimestampBetween("LOGIN", startDate, endDate);
    
    // Then
    assertNotNull(loginEvents);
    // Would normally assert size based on test data
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=ActivityLogRepositoryTest::testRepositoryCanQueryLoginEvents`
Expected: FAIL with "cannot find symbol" for query methods

- [ ] **Step 3: Write minimal implementation**
```java
// Add to ActivityLogRepository.java
List<ActivityLog> findByActionAndTimestampBetween(String action, LocalDateTime startDate, LocalDateTime endDate);
List<ActivityLog> findByUserEmailAndActionAndTimestampBetween(String userEmail, String action, LocalDateTime startDate, LocalDateTime endDate);
List<ActivityLog> findBySessionIdNotNullOrderByLoginTimestampDesc();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=ActivityLogRepositoryTest::testRepositoryCanQueryLoginEvents`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/company/jobportal/repository/ActivityLogRepository.java
git commit -m "feat: add query methods to ActivityLogRepository for session tracking"
```

### Task 3: Create UserActivityService to calculate engagement metrics

**Files:**
- Create: `src/main/java/com/company/jobportal/service/UserActivityService.java`
- Create: `src/main/java/com/company/jobportal/service/UserActivityServiceImpl.java`

**Interfaces:**
- Consumes: ActivityLogRepository
- Produces: UserActivityService with methods to calculate DAU, WAU, session duration, login frequency, feature usage

- [ ] **Step 1: Write the failing test**
```java
// Test that UserActivityService can calculate DAU
@Test
public void testCalculateDailyActiveUsers() {
    // Given
    LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
    LocalDateTime tomorrow = today.plusDays(1);
    
    // When
    int dau = userActivityService.calculateDailyActiveUsers(today, tomorrow);
    
    // Then
    assertEquals(expectedDau, dau); // Would need test data setup
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserActivityServiceTest::testCalculateDailyActiveUsers`
Expected: FAIL with "cannot find symbol" for UserActivityService

- [ ] **Step 3: Write minimal implementation**
```java
// Create UserActivityService.java
public interface UserActivityService {
    int calculateDailyActiveUsers(LocalDateTime startDate, LocalDateTime endDate);
    int calculateWeeklyActiveUsers(LocalDateTime startDate, LocalDateTime endDate);
    double calculateAverageSessionDuration(LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Integer> calculateLoginFrequencyDistribution(LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Double> calculateFeatureUsagePercentage(LocalDateTime startDate, LocalDateTime endDate);
}

// Create UserActivityServiceImpl.java
@Service
public class UserActivityServiceImpl implements UserActivityService {
    
    @Autowired
    private ActivityLogRepository activityLogRepository;
    
    @Override
    public int calculateDailyActiveUsers(LocalDateTime startDate, LocalDateTime endDate) {
        // Count distinct users with login events in date range
        List<ActivityLog> loginEvents = activityLogRepository.findByActionAndTimestampBetween("LOGIN", startDate, endDate);
        Set<String> uniqueUsers = loginEvents.stream()
            .map(ActivityLog::getUserEmail)
            .collect(Collectors.toSet());
        return uniqueUsers.size();
    }
    
    @Override
    public int calculateWeeklyActiveUsers(LocalDateTime startDate, LocalDateTime endDate) {
        // Similar implementation for weekly active users
        List<ActivityLog> loginEvents = activityLogRepository.findByActionAndTimestampBetween("LOGIN", startDate, endDate);
        Set<String> uniqueUsers = loginEvents.stream()
            .map(ActivityLog::getUserEmail)
            .collect(Collectors.toSet());
        return uniqueUsers.size();
    }
    
    @Override
    public double calculateAverageSessionDuration(LocalDateTime startDate, LocalDateTime endDate) {
        List<ActivityLog> sessions = activityLogRepository.findBySessionIdNotNullOrderByLoginTimestampDesc()
            .stream()
            .filter(log -> log.getLoginTimestamp().isAfter(startDate) && 
                          log.getLogoutTimestamp() != null && 
                          log.getLogoutTimestamp().isBefore(endDate))
            .collect(Collectors.toList());
        
        if (sessions.isEmpty()) {
            return 0.0;
        }
        
        long totalDurationSeconds = sessions.stream()
            .mapToLong(session -> 
                ChronoUnit.SECONDS.between(session.getLoginTimestamp(), session.getLogoutTimestamp()))
            .sum();
        
        return (double) totalDurationSeconds / sessions.size();
    }
    
    @Override
    public Map<String, Integer> calculateLoginFrequencyDistribution(LocalDateTime startDate, LocalDateTime endDate) {
        // Implementation for login frequency distribution
        Map<String, Integer> distribution = new HashMap<>();
        distribution.put("0-1", 0);
        distribution.put("2-5", 0);
        distribution.put("6-10", 0);
        distribution.put("11+", 0);
        
        List<Object[]> loginCounts = activityLogRepository.countLoginsPerUserBetween(startDate, endDate);
        for (Object[] result : loginCounts) {
            String email = (String) result[0];
            Long count = (Long) result[1];
            int loginCount = count.intValue();
            
            if (loginCount <= 1) {
                distribution.put("0-1", distribution.get("0-1") + 1);
            } else if (loginCount <= 5) {
                distribution.put("2-5", distribution.get("2-5") + 1);
            } else if (loginCount <= 10) {
                distribution.put("6-10", distribution.get("6-10") + 1);
            } else {
                distribution.put("11+", distribution.get("11+") + 1);
            }
        }
        
        return distribution;
    }
    
    @Override
    public Map<String, Double> calculateFeatureUsagePercentage(LocalDateTime startDate, LocalDateTime endDate) {
        // Implementation for feature usage percentage
        Map<String, Double> usage = new HashMap<>();
        usage.put("job_searches", 0.0);
        usage.put("applications", 0.0);
        usage.put("profile_updates", 0.0);
        
        long totalUsers = activityLogRepository.countDistinctUsersByTimestampBetween(startDate, endDate);
        if (totalUsers == 0) {
            return usage;
        }
        
        long jobSearchCount = activityLogRepository.countDistinctUsersByActionAndTimestampBetween("JOB_SEARCH", startDate, endDate);
        long applicationCount = activityLogRepository.countDistinctUsersByActionAndTimestampBetween("APPLICATION_SUBMIT", startDate, endDate);
        long profileUpdateCount = activityLogRepository.countDistinctUsersByActionAndTimestampBetween("PROFILE_UPDATE", startDate, endDate);
        
        usage.put("job_searches", (double) jobSearchCount / totalUsers * 100);
        usage.put("applications", (double) applicationCount / totalUsers * 100);
        usage.put("profile_updates", (double) profileUpdateCount / totalUsers * 100);
        
        return usage;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=UserActivityServiceTest::testCalculateDailyActiveUsers`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/company/jobportal/service/UserActivityService.java
git add src/main/java/com/company/jobportal/service/UserActivityServiceImpl.java
git commit -m "feat: create UserActivityService to calculate engagement metrics"
```

### Task 4: Extend DashboardStatsService to include engagement metrics

**Files:**
- Modify: `src/main/java/com/company/jobportal/service/DashboardStatsService.java`
- Modify: `src/main/java/com/company/jobportal/service/DashboardStatsServiceImpl.java`

**Interfaces:**
- Consumes: UserActivityService
- Produces: Extended DashboardStatsService with engagement metrics in getAdminStats()

- [ ] **Step 1: Write the failing test**
```java
// Test that DashboardStatsService includes engagement metrics
@Test
public void testGetAdminStatsIncludesEngagementMetrics() {
    // When
    DashboardStats stats = dashboardStatsService.getAdminStats();
    
    // Then
    assertNotNull(stats.getDailyActiveUsers());
    assertNotNull(stats.getWeeklyActiveUsers());
    assertNotNull(stats.getAverageSessionDuration());
    assertNotNull(stats.getLoginFrequencyDistribution());
    assertNotNull(stats.getFeatureUsagePercentage());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=DashboardStatsServiceTest::testGetAdminStatsIncludesEngagementMetrics`
Expected: FAIL with "cannot find symbol" for engagement metrics fields

- [ ] **Step 3: Write minimal implementation**
```java
// Modify DashboardStatsService.java to add engagement metrics methods
DashboardStats getAdminStats();

// Modify DashboardStats.java to include engagement metrics fields
private int dailyActiveUsers;
private int weeklyActiveUsers;
private double averageSessionDuration;
private Map<String, Integer> loginFrequencyDistribution;
private Map<String, Double> featureUsagePercentage;

// Add getters and setters for the new fields

// Modify DashboardStatsServiceImpl.java
@Service
public class DashboardStatsServiceImpl implements DashboardStatsService {
    
    @Autowired
    private UserActivityService userActivityService;
    
    @Autowired
    private ActivityLogRepository activityLogRepository;
    
    // Other existing dependencies...
    
    @Override
    public DashboardStats getAdminStats() {
        DashboardStats stats = new DashboardStats();
        
        // Set existing stats (totalUsers, totalEmployers, etc.)
        // ... existing code ...
        
        // Calculate and set engagement metrics
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime weekStart = now.minusDays(7).withHour(0).withMinute(0).withSecond(0);
        
        stats.setDailyActiveUsers(userActivityService.calculateDailyActiveUsers(todayStart, now));
        stats.setWeeklyActiveUsers(userActivityService.calculateWeeklyActiveUsers(weekStart, now));
        stats.setAverageSessionDuration(userActivityService.calculateAverageSessionDuration(weekStart, now));
        stats.setLoginFrequencyDistribution(userActivityService.calculateLoginFrequencyDistribution(weekStart, now));
        stats.setFeatureUsagePercentage(userActivityService.calculateFeatureUsagePercentage(weekStart, now));
        
        return stats;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=DashboardStatsServiceTest::testGetAdminStatsIncludesEngagementMetrics`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/company/jobportal/service/DashboardStatsService.java
git add src/main/java/com/company/jobportal/service/DashboardStatsServiceImpl.java
git add src/main/java/com/company/jobportal/model/DashboardStats.java
git commit -m "feat: extend DashboardStatsService to include engagement metrics"
```

### Task 5: Update frontend admin stats visualization to show engagement metrics

**Files:**
- Modify: `src/main/resources/static/js/app.js`

**Interfaces:**
- Consumes: Extended admin stats API response
- Produces: Updated admin stats visualization with engagement metrics

- [ ] **Step 1: Write the failing test**
```javascript
// Test that loadAdminStats renders engagement metrics
// This would be a frontend test - for now we'll verify manually
```

- [ ] **Step 2: Run test to verify it fails**

Manual verification: Check that engagement metrics are not displayed in admin stats
Expected: FAIL (metrics not shown)

- [ ] **Step 3: Write minimal implementation**
```javascript
// Modify loadAdminStats function in app.js
async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const stats = await response.json();
        
        // Update existing stats display
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-employers').textContent = stats.totalEmployers;
        // ... other existing stats ...
        
        // Add engagement metrics display
        document.getElementById('dau-value').textContent = stats.dailyActiveUsers;
        document.getElementById('wau-value').textContent = stats.weeklyActiveUsers;
        document.getElementById('avg-session-value').textContent = 
            Math.round(stats.averageSessionDuration / 60) + ' min'; // Convert seconds to minutes
        
        // Update login frequency distribution chart
        updateLoginFrequencyChart(stats.loginFrequencyDistribution);
        
        // Update feature usage chart
        updateFeatureUsageChart(stats.featureUsagePercentage);
        
    } catch (error) {
        console.error('Error loading admin stats:', error);
        showError('Failed to load admin statistics');
    }
}

// Add helper functions to update charts
function updateLoginFrequencyChart(distribution) {
    // Implementation to update login frequency chart
    // This would depend on the charting library being used
}

function updateFeatureUsageChart(usage) {
    // Implementation to update feature usage chart
    // This would depend on the charting library being used
}
```

- [ ] **Step 4: Run test to verify it passes**

Manual verification: Check that engagement metrics are displayed in admin stats
Expected: PASS (metrics shown correctly)

- [ ] **Step 5: Commit**

```bash
git add src/main/resources/static/js/app.js
git commit -m "feat: update frontend admin stats visualization to show engagement metrics"
```

### Task 6: Add API endpoint for admin stats if needed

**Files:**
- Modify: `src/main/java/com/company/jobportal/controller/AdminController.java`

**Interfaces:**
- Consumes: DashboardStatsService
- Produces: Admin stats API endpoint with engagement metrics

- [ ] **Step 1: Write the failing test**
```java
// Test that admin stats endpoint returns engagement metrics
@Test
public void testAdminStatsEndpointReturnsEngagementMetrics() throws Exception {
    // When
    mockMvc.perform(get("/api/admin/stats"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dailyActiveUsers").exists())
        .andExpect(jsonPath("$.weeklyActiveUsers").exists())
        .andExpect(jsonPath("$.averageSessionDuration").exists())
        .andExpect(jsonPath("$.loginFrequencyDistribution").exists())
        .andExpect(jsonPath("$.featureUsagePercentage").exists());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=AdminControllerTest::testAdminStatsEndpointReturnsEngagementMetrics`
Expected: FAIL if endpoint doesn't exist or doesn't return engagement metrics

- [ ] **Step 3: Write minimal implementation**
```java
// Modify AdminController.java
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private DashboardStatsService dashboardStatsService;
    
    // Other existing endpoints...
    
    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getAdminStats() {
        DashboardStats stats = dashboardStatsService.getAdminStats();
        return ResponseEntity.ok(stats);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=AdminControllerTest::testAdminStatsEndpointReturnsEngagementMetrics`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/company/jobportal/controller/AdminController.java
git commit -m "feat: add admin stats endpoint with engagement metrics"
```
