# Job Portal Remaining Features Plan

## Overview
This document outlines the remaining features to be implemented or enhanced in the Job Portal application based on the comparison between the current implementation and the features described in `job_portal_descrpription.txt`.

## Remaining Features

### 1. Real-Time User Activity Monitoring
**Description**: The Admin Dashboard requires real-time updates on user activities and job applications, currently implemented as fetch-on-refresh.

**Current State**: 
- Activity logging exists (ActivityLogService, ActivityLogRepository)
- Frontend loads activities on dashboard load and manual refresh
- No automatic real-time updates

**Implementation Plan**:
- Add WebSocket dependency: `spring-boot-starter-websocket`
- Create WebSocket configuration class
- Implement WebSocket handler to broadcast new activity events
- Modify ActivityLogService to publish events to WebSocket when activities are logged
- Update frontend (`loadAdminActivities`) to connect to WebSocket and update feed in real-time
- Maintain fallback to polling for browsers that don't support WebSocket

**Files to Modify**:
- `pom.xml` (add WebSocket dependency)
- `src/main/java/com/company/jobportal/config/WebSocketConfig.java` (new)
- `src/main/java/com/company/jobportal/websocket/ActivityWebSocketHandler.java` (new)
- `src/main/java/com/company/jobportal/service/ActivityLogService.java` (modify to publish events)
- `src/main/resources/static/js/app.js` (modify `loadAdminActivities` and add WebSocket connection)

**Priority**: High (explicitly mentioned as "Real-time updates" in description)

---

### 2. Enhanced User Engagement Metrics
**Description**: Current stats show basic counts but lack detailed engagement metrics like login frequency, session duration, feature usage.

**Current State**:
- Admin stats: totalUsers, totalEmployers, totalJobSeekers, totalAdmins
- Missing: engagement metrics

**Implementation Plan**:
- Add tracking for user login/logout events with timestamps
- Extend ActivityLog entity to include session data
- Create UserActivityService to calculate engagement metrics
- Extend DashboardStatsService.getAdminStats() to include:
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Average session duration
  - Login frequency distribution
  - Feature usage percentages (job searches, applications, profile updates)
- Add repository methods for querying activity trends
- Update frontend admin stats visualization to show engagement metrics

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/ActivityLog.java` (add session fields)
- `src/main/java/com/company/jobportal/repository/ActivityLogRepository.java` (add query methods)
- `src/main/java/com/company/jobportal/service/UserActivityService.java` (new)
- `src/main/java/com/company/jobportal/service/DashboardStatsService.java` (extend getAdminStats)
- `src/main/java/com/company/jobportal/service/DashboardStatsServiceImpl.java` (implement extensions)
- `src/main/java/com/company/jobportal/controller/AdminController.java` (add new stats endpoint if needed)
- `src/main/resources/static/js/app.js` (update admin stats visualization)

**Priority**: Medium-High

---

### 3. Sophisticated Statistics Visualization
**Description**: Current statistics use CSS-based bar charts; description implies more sophisticated graphs.

**Current State**:
- Simple CSS bars in dashboard tabs (adminTabStats, employerTabAnalytics)
- No external charting library

**Implementation Plan**:
- Integrate Chart.js library via CDN or npm
- Replace CSS bar charts with interactive Chart.js visualizations:
  - Line charts for trends over time (job postings per week, application volume)
  - Pie charts for status distributions
  - Bar charts with tooltips and animations
  - Multi-axis charts for correlated metrics
- Create reusable chart components in JavaScript
- Update all stats loading functions to render charts instead of CSS bars

**Files to Modify**:
- `src/main/resources/static/index.html` (add Chart.js script)
- `src/main/resources/static/js/app.js` (replace chart rendering in):
  - `loadAdminStats()`
  - `loadEmployerStats()`
  - `loadEmployerAnalyticsCharts()`
  - `loadSeekerStats()` (if enhanced)
- Consider creating chart helper functions for reusability

**Priority**: Medium

---

### 4. Advanced Search and Filtering
**Description**: Current search is limited to keyword, location, and job type.

**Current State**:
- Basic search: keyword, location, jobType
- Missing: salary range, benefits, experience level, company size, etc.

**Implementation Plan**:
- Extend JobListing model with new fields:
  - salaryMin, salaryMax (or keep current salary and add range)
  - remoteOptions (fully remote, hybrid, on-site)
  - experienceLevel (entry, mid, senior, executive)
  - benefits (health insurance, 401k, equity, etc.)
  - companySize, industry
- Update JobListingRepository with search methods for new fields
- Update JobListingService.searchJobs() to handle new parameters
- Update JobListingController.searchJobs endpoint
- Extend frontend search form:
  - Add salary range inputs
  - Add checkboxes for benefits/remote options
  - Add dropdowns for experience level, company size, industry
- Implement saved searches feature (see #7)
- Update job card display to show new fields appropriately

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/JobListing.java` (add fields)
- `src/main/java/com/company/jobportal/repository/JobListingRepository.java` (add search methods)
- `src/main/java/com/company/jobportal/service/JobListingService.java` (update searchJobs)
- `src/main/java/com/company/jobportal/service/JobListingServiceImpl.java` (implement)
- `src/main/java/com/company/jobportal/controller/JobListingController.java` (update searchJobs)
- `src/main/resources/static/js/app.js` (update search form and job card rendering)
- `src/main/resources/static/index.html` (update search form HTML)

**Priority**: High

---

### 5. Resume Parsing and Skill Extraction
**Description**: Users manually enter skills; system should auto-extract skills from uploaded resumes.

**Current State**:
- Manual skills input in profile
- Resume upload stores file URL but doesn't parse content

**Implementation Plan**:
- Add resume parsing dependency (Apache Tika or similar)
- Create ResumeParsingService to extract text from PDF/DOCX
- Implement skill extraction algorithm:
  - Simple approach: match against predefined skill dictionary
  - Advanced approach: NLP-based entity recognition (skills, technologies, certifications)
- Modify file upload flow to auto-extract and suggest skills
- Add confirmation step before saving extracted skills to profile
- Update User model to store parsed resume text optionally
- Enhance job recommendation algorithm to use parsed skills

**Files to Modify**:
- `pom.xml` (add Tika dependency)
- `src/main/java/com/company/jobportal/service/ResumeParsingService.java` (new)
- `src/main/java/com/company/jobportal/service/UserServiceImpl.java` (enhance upload handling)
- `src/main/java/com/company/jobportal/controller/FileUploadController.java` (modify resume upload)
- `src/main/resources/static/js/app.js` (update resume upload handling)
- `src/main/java/com/company/jobportal/service/JobListingServiceImpl.java` (enhance recommendation to use parsed skills)

**Priority**: Medium-High

---

### 6. Email Notification System
**Description**: Currently only in-app notifications; need email alerts for important events.

**Current State**:
- In-app toast notifications
- No email service configured

**Implementation Plan**:
- Add Spring Boot Starter Mail dependency
- Configure email properties in application.properties
- Create EmailService with template support
- Define email templates for:
  - Welcome/verification emails
  - Password reset
  - Application submitted/status changed
  - New messages
  - Job approved/rejected (for employers)
  - Interview scheduled
  - Job recommendations weekly digest
  - System announcements (admins)
- Create NotificationService to manage in-app and email notifications
- Add email preferences in user settings
- Modify relevant services to trigger notifications:
  - UserService (welcome, password reset)
  - ApplicationService (status changes)
  - MessageService (new messages)
  - JobListingService (approval/rejection)
  - JobListingServiceImpl (recommendations digest - could be scheduled)
- Add email template resources (HTML/Text)

**Files to Modify**:
- `pom.xml` (add mail dependency)
- `src/main/resources/application.properties` (add email config)
- `src/main/java/com/company/jobportal/service/EmailService.java` (new)
- `src/main/java/com/company/jobportal/service/EmailTemplateService.java` (new)
- `src/main/java/com/company/jobportal/service/NotificationService.java` (new)
- `src/main/java/com/company/jobportal/service/UserService.java` (extend interface)
- `src/main/java/com/company/jobportal/service/UserServiceImpl.java` (implement)
- `src/main/java/com/company/jobportal/service/ApplicationService.java` (extend and impl)
- `src/main/java/com/company/jobportal/service/MessageService.java` (extend and impl)
- `src/main/java/com/company/jobportal/service/JobListingService.java` (extend and impl)
- `src/main/resources/templates/email/` (directory for email templates)
- `src/main/java/com/company/jobportal/controller/UserController.java` (add email preferences endpoint)
- `src/main/resources/static/js/app.js` (add email preferences UI)

**Priority**: High

---

### 7. Saved Searches and Job Alerts
**Description**: Users should be able to save searches and get alerts for new matching jobs.

**Current State**:
- Manual search each visit
- No saving or alerting capability

**Implementation Plan**:
- Create SavedSearch entity (userId, searchCriteria, name, alertFrequency)
- Create SavedSearchRepository and Service
- Add endpoints for managing saved searches:
  - GET/POST/PUT/DELETE /api/users/searches
  - POST /api/users/searches/{id}/alert (test alert)
- Implement alert checking service (could use @Scheduled)
- Modify search flow to include "Save this search" button
- Create "Saved Searches" tab in job seeker dashboard
- Implement email/in-app alerts for new matching jobs
- Add alert frequency options: real-time, daily, weekly
- Enhance job recommendation to consider saved searches

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/SavedSearch.java` (new)
- `src/main/java/com/company/jobportal/repository/SavedSearchRepository.java` (new)
- `src/main/java/com/company/jobportal/service/SavedSearchService.java` (new)
- `src/main/java/com/company/jobportal/service/SavedSearchServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/controller/SavedSearchController.java` (new)
- `src/main/resources/static/js/app.js` (add saved searches UI and alert management)
- `src/main/resources/static/index.html` (add saved searches tab to seeker dashboard)
- Consider adding @Scheduled alert checker service

**Priority**: Medium

---

### 8. Interview Scheduling System
**Description**: Application tracking should include interview scheduling capabilities.

**Current State**:
- Application status: PENDING, REVIEWED, SHORTLISTED, REJECTED, ACCEPTED
- No interview tracking

**Implementation Plan**:
- Add Interview entity (job seeker, job listing, scheduled date/time, video link, interviewer notes, status)
- Add interview status to application flow (between SHORTLISTED and ACCEPTED)
- Update Application status enum to include INTERVIEW_SCHEDULED, INTERVIEW_COMPLETED
- Create InterviewRepository and Service
- Add endpoints for interview management:
  - POST /api/applications/{id}/schedule-interview
  - PUT /api/interviews/{id}
  - GET /api/interviews/{id}
  - DELETE /api/interviews/{id}
  - GET /api/applications/{id}/interview
- Update application status update logic to handle interview scheduling
- Add calendar integration (Google Calendar API or Outlook)
- Update frontend:
  - Add interview scheduling in employer application management
  - Add interview tracking in job seeker application history
  - Add video call integration (placeholder for now)
- Update activity logging to track interview events

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Interview.java` (new)
- `src/main/java/com/company/jobportal/repository/InterviewRepository.java` (new)
- `src/main/java/com/company/jobportal/service/InterviewService.java` (new)
- `src/main/java/com/company/jobportal/service/InterviewServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/model/Application.java` (update status enum)
- `src/main/java/com/company/jobportal/repository/ApplicationRepository.java` (may need updates)
- `src/main/java/com/company/jobportal/service/ApplicationService.java` (extend and impl)
- `src/main/java/com/company/jobportal/controller/ApplicationController.java` (add interview endpoints)
- `src/main/resources/static/js/app.js` (add interview scheduling UI)
- `src/main/java/com/company/jobportal/service/ActivityLogService.java` (log interview events)

**Priority**: Medium

---

### 9. Employer Branding and Company Profiles
**Description**: Job listings show basic company name; need rich company profiles.

**Current State**:
- JobListing has companyName string
- No separate company entity or profile

**Implementation Plan**:
- Create Company entity (name, description, logo, website, size, industry, founded year, etc.)
- Update JobListing to reference Company instead of just companyName string
- Create CompanyRepository and Service
- Add company management endpoints:
  - GET/POST/PUT/DELETE /api/companies
  - GET /api/companies/{id}
  - GET /api/companies/{id}/jobs
- Allow employers to create and manage their company profile
- Update job creation to link to company (or create new)
- Update job display to show company logo and info
- Add company browsing/searching for job seekers
- Update activity logging for company-related events
- Consider adding company verification/badge system

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Company.java` (new)
- `src/main/java/com/company/jobportal/repository/CompanyRepository.java` (new)
- `src/main/java/com/company/jobportal/service/CompanyService.java` (new)
- `src/main/java/com/company/jobportal/service/CompanyServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/model/JobListing.java` (replace companyName with Company reference)
- `src/main/java/com/company/jobportal/repository/JobListingRepository.java` (update mappings)
- `src/main/java/com/company/jobportal/service/JobListingService.java` (update to handle Company)
- `src/main/java/com/company/jobportal/service/JobListingServiceImpl.java` (impl)
- `src/main/java/com/company/jobportal/controller/CompanyController.java` (new)
- `src/main/java/com/company/jobportal/controller/JobListingController.java` (update job creation/display)
- `src/main/resources/static/js/app.js` (update job card and forms)
- `src/main/resources/static/index.html` (update UI for company info)

**Priority**: Medium

---

### 10. Application Status Tracking Improvements
**Description**: Current statuses are basic; need more granular tracking with timestamps.

**Current State**:
- Application status: PENDING, REVIEWED, SHORTLISTED, REJECTED, ACCEPTED
- Single updatedAt timestamp

**Implementation Plan**:
- Expand Application status enum with more granular states:
  - APPLICATION_RECEIVED
  - RESUME_REVIEWED
  - PHONE_SCREEN_SCHEDULED
  - PHONE_SCREEN_COMPLETED
  - TECHNICAL_INTERVIEW_SCHEDULED
  - TECHNICAL_INTERVIEW_COMPLETED
  - FINAL_INTERVIEW_SCHEDULED
  - FINAL_INTERVIEW_COMPLETED
  - REFERENCE_CHECK
  - OFFER_EXTENDED
  - OFFER_ACCEPTED
  - HIRED
- Add timestamp fields for each major status transition (or use a status history table)
- Alternative: Create ApplicationStatusHistory entity to track all status changes with timestamps
- Update application service to manage status transitions properly
- Update frontend to show detailed status progression and timelines
- Enhance employer application management to update status through the funnel
- Update activity logging for status changes

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Application.java` (expand status enum, add timestamp fields OR)
- `src/main/java/com/company/jobportal/model/ApplicationStatusHistory.java` (new - recommended approach)
- `src/main/java/com/company/jobportal/repository/ApplicationStatusHistoryRepository.java` (new)
- `src/main/java/com/company/jobportal/service/ApplicationService.java` (extend and impl)
- `src/main/java/com/company/jobportal/repository/ApplicationRepository.java` (may need updates)
- `src/main/java/com/company/jobportal/controller/ApplicationController.java` (update status update logic)
- `src/main/resources/static/js/app.js` (update application status display)
- `src/main/java/com/company/jobportal/service/ActivityLogService.java` (log status changes)

**Priority**: Medium-High

---

### 11. Real-Time Notifications System
**Description**: Need WebSocket-based in-app notifications for immediate feedback.

**Current State**:
- Toast notifications for immediate actions
- No persistent notification center
- No real-time push notifications

**Implementation Plan**:
- Extend WebSocket implementation from #1 to handle notifications
- Create Notification entity (userId, type, content, relatedId, isRead, createdAt)
- Create NotificationRepository and Service
- Add endpoints:
  - GET /api/notifications (get user's notifications)
  - PUT /api/notifications/{id}/read
  - PUT /api/notifications/read-all
  - DELETE /api/notifications/{id}
- Modify WebSocket handler to broadcast notifications
- Update services to create notifications:
  - MessageService (new messages)
  - ApplicationService (status changes)
  - JobListingService (job approvals, recommendations)
  - UserService (mentions, tags)
- Update frontend:
  - Add notification bell icon in header
  - Add notification dropdown panel
  - Show unread count badge
  - Real-time update via WebSocket
  - Mark as read/delete functionality
  - Notification preferences

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Notification.java` (new)
- `src/main/java/com/company/jobportal/repository/NotificationRepository.java` (new)
- `src/main/java/com/company/jobportal/service/NotificationService.java` (new)
- `src/main/java/com/company/jobportal/service/NotificationServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/websocket/NotificationWebSocketHandler.java` (new or extend Activity handler)
- `src/main/java/com/company/jobportal/service/MessageService.java` (extend and impl)
- `src/main/java/com/company/jobportal/service/ApplicationService.java` (extend and impl)
- `src/main/java/com/company/jobportal/service/JobListingService.java` (extend and impl)
- `src/main/resources/static/js/app.js` (add notification UI and WebSocket handling)
- `src/main/resources/static/index.html` (add notification bell to header)

**Priority**: High

---

### 12. Multi-Language Support (i18n)
**Description**: Application currently English-only; needs internationalization.

**Current State**:
- All UI text hardcoded in English
- No language selection

**Implementation Plan**:
- Add Spring Boot i18n support
- Create message properties files:
  - messages.properties (English - default)
  - messages_es.properties (Spanish)
  - messages_fr.properties (French)
  - messages_de.properties (German)
  - etc. as needed
- Replace all hardcoded strings in:
  - Java code (use MessageSource)
  - Thymeleaf templates (if any) - but we have HTML/JS
  - JavaScript files (more complex - may need JSON approach)
- For JavaScript, consider:
  - Creating a JSON-based i18n system
  - Or having server-side render initial HTML with localized strings
  - Or using data-i18n attributes and JS to replace content
- Add language selector in user settings and header
- Store language preference in user profile/localStorage
- Configure Spring Boot to accept locale via header/param/cookie
- Update all UI strings to use keys

**Files to Modify**:
- `pom.xml` (add spring-boot-starter-web if not already has full web)
- `src/main/java/com/company/jobportal/config/MvcConfig.java` (new - configure LocaleResolver)
- `src/main/resources/messages.properties` (base English)
- `src/main/resources/messages_*.properties` (translations)
- `src/main/java/com/company/jobportal/service/MessageSourceService.java` (new - wrapper for easier access)
- `src/main/java/com/company/jobportal/controller/LanguageController.java` (new - for setting preference)
- `src/main/resources/static/js/app.js` (replace hardcoded strings with i18n calls)
- `src/main/resources/static/index.html` (update to use i18n attributes or JS replacement)
- Consider build step to extract strings for translation

**Priority**: Low-Medium (nice to have but not critical for core functionality)

---

### 13. Analytics and Reporting Export
**Description**: Need ability to export reports and analytics data.

**Current State**:
- View-only statistics in dashboards
- No export functionality

**Implementation Plan**:
- Add export dependencies (Apache POI for Excel, iText for PDF, or similar)
- Create ExportService for generating reports
- Add export endpoints:
  - GET /api/admin/stats/export?format=csv|pdf|excel
  - GET /api/jobs/employer/stats/export?format=csv|pdf|excel
  - GET /api/jobs/seeker/stats/export?format=csv|pdf|excel
  - GET /api/applications/export?format=csv|pdf|excel&userId={id}&type=employer|seeker
- Implement export formats:
  - CSV: simple and universal
  - Excel: multiple sheets, formatting
  - PDF: formatted reports with charts (may need chart rendering server-side or use images)
- Add export buttons in dashboard stats sections
- Allow specifying date ranges and filters for exports
- Consider scheduling automated report delivery via email

**Files to Modify**:
- `pom.xml` (add export dependencies)
- `src/main/java/com/company/jobportal/service/ExportService.java` (new)
- `src/main/java/com/company/jobportal/service/ExportServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/controller/AdminController.java` (add export endpoint)
- `src/main/java/com/company/jobportal/controller/JobListingController.java` (add export endpoints)
- `src/main/java/com/company/jobportal/controller/ApplicationController.java` (add export endpoint)
- `src/main/resources/static/js/app.js` (add export buttons to stats sections)
- `src/main/resources/static/index.html` (update stats sections to include export buttons)

**Priority**: Medium

---

### 14. Audit Trail and Compliance Features
**Description**: Basic activity logging exists; need comprehensive audit trail for security/compliance.

**Current State**:
- ActivityLogService logs specific user actions
- Missing: comprehensive access logging, data change tracking, compliance features

**Implementation Plan**:
- Enhance activity logging to include:
  - IP address and user agent
  - Login/logout events with geolocation (optional)
  - Data access audit for sensitive information (salaries, personal data)
  - Before/after values for data changes
- Create AuditLog entity separate from ActivityLog (more detailed)
- Implement audit aspect or filter to automatically log:
  - All API requests/responses (with sanitization)
  - All database changes (via Hibernate Envers or custom interceptors)
  - Authentication events (success/fail)
  - Authorization failures
- Add GDPR/CCPA compliance features:
  - Data export endpoint (for users to download their data)
  - Data deletion/anonymization endpoint
  - Consent tracking
- Create admin tools for viewing and exporting audit logs
- Add alerts for suspicious activity patterns

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/AuditLog.java` (new)
- `src/main/java/com/company/jobportal/repository/AuditLogRepository.java` (new)
- `src/main/java/com/company/jobportal/service/AuditLogService.java` (new)
- `src/main/java/com/company/jobportal/service/AuditLogServiceImpl.java` (new)
- Consider implementing:
  - `src/main/java/com/company/jobportal/config/AuditConfig.java` (new - Hibernate Envers or custom)
  - Or `src/main/java/com/company/jobportal/filter/AuditFilter.java` (new - servlet filter)
- `src/main/java/com/company/jobportal/controller/AuditController.java` (new - admin audit viewing)
- `src/main/java/com/company/jobportal/controller/UserController.java` (add data export/deletion endpoints)
- `src/main/resources/static/js/app.js` (add audit log viewer and compliance tools)
- `src/main/resources/static/index.html` (add admin audit tab)

**Priority**: Medium (important for production but not core functionality)

---

### 15. Moderation and Content Reporting System
**Description**: Users should be able to report inappropriate content or behavior.

**Current State**:
- Admin approves job listings
- No user reporting system

**Implementation Plan**:
- Create Report entity (reporterId, reportedUserId, reportedJobId, reportedMessageId, reason, status, etc.)
- Create ReportRepository and Service
- Add reporting endpoints:
  - POST /api/reports/job/{jobId}
  - POST /api/reports/user/{userId}
  - POST /api/reports/message/{messageId}
  - GET /api/admin/reports (moderation queue)
  - PUT /api/admin/reports/{id}/resolve
- Add "Report" buttons/actions in UI:
  - On job cards
  - On user profiles
  - In message threads
- Implement moderation workflow for admins
- Add reputation/scoring system for users (optional)
- Consider automated spam detection for job listings/messages
- Update activity logging for moderation events

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Report.java` (new)
- `src/main/java/com/company/jobportal/repository/ReportRepository.java` (new)
- `src/main/java/com/company/jobportal/service/ReportService.java` (new)
- `src/main/java/com/company/jobportal/service/ReportServiceImpl.java` (new)
- `src/main/java/com/company/jobportal/controller/ReportController.java` (new)
- `src/main/java/com/company/jobportal/service/JobListingService.java` (extend for reporting)
- `src/main/java/com/company/jobportal/service/UserService.java` (extend for reporting)
- `src/main/java/com/company/jobportal/service/MessageService.java` (extend for reporting)
- `src/main/resources/static/js/app.js` (add report buttons/UI)
- `src/main/resources/static/index.html` (add moderation tab to admin dashboard)

**Priority**: Medium

---

### 16. Enhanced Employer-Specific Engagement Metrics
**Description**: Employer stats need deeper analytics beyond basic application counts.

**Current State**:
- Employer stats: totalJobs, activeJobs, filledJobs, pendingApprovalJobs, totalApplications, pendingReview, shortlisted, accepted, rejected, applicantsPerJob
- Missing: time-based and efficiency metrics

**Implementation Plan**:
- Enhance DashboardStatsService.getEmployerStats() to include:
  - Average time-to-hire (from application to acceptance)
  - Application completion rate (percentage of started applications that are submitted)
  - Candidate response time (average time for candidates to respond to messages)
  - Offer acceptance rate
  - Job listing view-to-application rate (if views are tracked)
  - Source effectiveness (if tracking how candidates found jobs)
  - Retention rate (if tracking post-hire data)
- Add tracking for relevant events (application start, message sent/received, etc.)
- Update frontend employer analytics to show these metrics
- Consider creating employer-specific reports

**Files to Modify**:
- `src/main/java/com/company/jobportal/model/Application.java` (add timestamps for tracking)
- `src/main/java/com/company/jobportal/model/Message.java` (add read receipts/timestamps if needed)
- `src/main/java/com/company/jobportal/repository/ApplicationRepository.java` (add query methods for timing)
- `src/main/java/com/company/jobportal/repository/MessageRepository.java` (add query methods if needed)
- `src/main/java/com/company/jobportal/service/DashboardStatsService.java` (extend getEmployerStats)
- `src/main/java/com/company/jobportal/service/DashboardStatsServiceImpl.java` (implement extensions)
- `src/main/java/com/company/jobportal/controller/JobListingController.java` (may need new endpoint if stats change significantly)
- `src/main/resources/static/js/app.js` (update employer stats and analytics visualization)

**Priority**: Medium

---

## Implementation Priorities

### High Priority
1. Real-Time User Activity Monitoring (WebSocket)
2. Email Notification System
3. Advanced Search and Filtering
4. Real-Time Notifications System

### Medium-High Priority
5. Enhanced User Engagement Metrics
6. Resume Parsing and Skill Extraction
7. Application Status Tracking Improvements

### Medium Priority
8. Employer Branding and Company Profiles
9. Interview Scheduling System
10. Analytics and Reporting Export
11. Moderation and Content Reporting System
12. Enhanced Employer-Specific Engagement Metrics
13. Sophisticated Statistics Visualization

### Low-Medium Priority
14. Audit Trail and Compliance Features
15. Multi-Language Support (i18n)
16. Saved Searches and Job Alerts

## Dependencies and Ordering

Some features depend on others:
- Real-time notifications (#11) builds on WebSocket implementation (#1)
- Enhanced analytics (#2, #16) benefit from better tracking in other features
- Export functionality (#13) works best after stats are enhanced
- i18n (#12) can be done at any time but is easier early in development

## Estimated Effort

Each feature is estimated to take 1-3 weeks of development time depending on complexity and familiarity with the codebase. The highest priority features (WebSocket, email, search enhancements, notifications) should deliver significant user experience improvements.

## Conclusion

The core job portal functionality is well-implemented. The remaining features focus on enhancing user experience with real-time capabilities, better analytics, proactive engagement tools, and compliance features. Implementing these will bring the application closer to a production-ready, feature-complete job portal platform.