# Job Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete online job portal web application with Admin, Employer, and Job Seeker user roles, featuring job posting, application management, and user dashboards.

**Architecture:** Three-tier architecture with RESTful API backend (Java/Spring Boot), relational database (MySQL/PostgreSQL), and frontend (HTML/CSS/JS with possible framework). Role-based access control separates functionality by user type.

**Tech Stack:** Java 17, Spring Boot 3.x, Spring Data JPA, Hibernate, MySQL, Maven, JUnit 5, Mockito, Lombok

**Spec:** job_portal_descrpription.txt

## Global Constraints
- Java version: 17+
- Build tool: Maven
- Package structure: com.company.jobportal
- REST API base path: /api
- Authentication: JWT-based
- File uploads: Limited to 10MB for resumes
- Passwords: Must be encoded using BCrypt
- Database: MySQL 8.0+ or PostgreSQL 13+
- Server port: 8080
- Session timeout: 30 minutes

---