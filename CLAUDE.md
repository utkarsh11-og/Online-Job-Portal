# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Build & Run
```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Run with hot reload (devtools)
mvn spring-boot:run -Dspring-boot.devtools.restart.enabled=true

# Run tests
mvn test

# Run specific test
mvn test -Dtest=TestClassName

# Database (H2 is default for dev)
# Access H2 console at http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:jobportal
```

### Project Structure
```
src/main/java/com/company/jobportal/
├── controller/    # REST controllers (/api/* endpoints)
├── service/       # Business logic interfaces & implementations
├── repository/    # Spring Data JPA repositories
├── model/         # JPA entities (User, JobListing, Application, etc.)
├── dto/           # Data transfer objects
└── config/        # Spring configuration (Security, WebSocket, etc.)

src/main/resources/
├── application.properties    # Main configuration (H2 DB, JWT, file upload)
└── static/                   # Static assets (CSS, JS, HTML)
```

## Key Features

### Three User Types
- **Admin**: User management, job approval, system settings
- **Employer**: Job posting, application management, candidate communication
- **Job Seeker**: Job search/resume upload, application tracking, profile

### Core API Endpoints
- Auth: `/api/auth/{register,login}`
- Users: `/api/users/{id}`
- Jobs: `/api/jobs/{id}` + `/api/jobs/{id}/applications`
- Applications: `/api/applications/{id}`
- Messages: `/api/messages/{id}` (WebSocket-backed messaging)
- System Settings: `/api/system-settings/*`

### Technology Stack
- **Backend**: Java 26, Spring Boot 4.1.1, Spring Data JPA, Hibernate
- **Security**: JWT authentication, Spring Security
- **Real-time**: WebSocket for activity monitoring and messaging
- **Build**: Maven
- **Testing**: JUnit 5, Mockito
- **Database**: H2 (dev), MySQL/PostgreSQL (prod)

## Development Guidelines

1. **API Design**: RESTful with proper HTTP status codes
2. **Validation**: Use javax.validation on DTOs
3. **Security**: All endpoints require authentication except auth/register/login
4. **DTO Pattern**: Use DTOs to decouple API from entities
5. **Service Layer**: Keep controllers thin; business logic in services
6. **Error Handling**: Global exception handling via @ControllerAdvice
7. **Lombok**: Use @Data, @NoArgsConstructor, etc. to reduce boilerplate
8. **Testing**: Write unit tests for service/controller layers
9. **WebSocket**: Use configured endpoints (/ws/activity) with proper interceptors

## Documentation & Planning

- Detailed feature plans and specifications are available in `docs/superpowers/plans/`
- Recent implementation notes:
  - Real-time activity monitoring via WebSocket (see WebSocketConfig.java)
  - Enhanced user engagement metrics tracking
  - Complete job portal feature set as outlined in planning documents

## Common Development Tasks

### Adding a New Feature
1. Update `application.properties` if new configuration needed
2. Create/update DTOs in `dto/` package for data transfer
3. Implement service logic in `service/` package
4. Create repository interface in `repository/` if database access needed
5. Add controller endpoints in `controller/` package
6. Update WebSocket configuration if real-time features needed
7. Add corresponding tests

### Database Changes
1. Modify JPA entities in `model/` package
2. Create/update repository methods
3. Ensure corresponding service methods handle new fields
4. Update DTOs if API contract changes
5. Migration note: H2 is used for dev; production uses MySQL/PostgreSQL with similar schema

### WebSocket Integration
1. Implement handler extending `TextWebSocketHandler` or use existing `ActivityWebSocketHandler`
2. Register handler in `WebSocketConfig.java`
3. Add interceptors for authentication/session handling as needed
4. Use `SimpMessagingTemplate` or `WebSocketSession` for broadcasting messages