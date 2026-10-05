# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an online job portal web application with three user types:
- **Admin**: Manages users, job listings, and system settings
- **Employer**: Posts job listings, manages applications, communicates with candidates
- **Job Seeker**: Searches and applies for jobs, uploads resumes, tracks application status

## Technology Stack
- Backend: Java 17, Spring Boot 3.x, Spring Data JPA, Hibernate
- Database: MySQL 8.0+ or PostgreSQL 13+
- Build Tool: Maven
- Testing: JUnit 5, Mockito
- Lombok for reducing boilerplate

## Development Setup

### Prerequisites
- Java JDK 17+
- Maven 3.6+
- Git
- IDE (IntelliJ IDEA, Eclipse, or VS Code)
- MySQL or PostgreSQL

### Common Commands

#### Backend (Java)
```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Run tests
mvn test

# Run a specific test
mvn test -Dtest=TestClassName

# Start in development mode with hot reload
mvn spring-boot:run -Dspring-boot.devtools.restart.enabled=true
```

#### Database
```bash
# Initialize database (if using migration scripts)
# Example for Flyway:
mvn flyway:migrate

# Reset database
mvn flyway:clean
mvn flyway:migrate
```

## Project Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── company/
│   │           └── jobportal/
│   │               ├── controller/     # REST controllers
│   │               ├── service/        # Business logic
│   │               ├── repository/     # Data access layer
│   │               ├── model/          # Entity classes
│   │               ├── dto/            # Data transfer objects
│   │               └── config/         # Configuration classes
│   └── resources/
│       ├── application.properties      # Configuration
│       ├── static/                     # Static assets (CSS, JS, images)
│       └── templates/                  # View templates (if using server-side rendering)
└── test/
    └── java/
        └── com/
            └── company/
                └── jobportal/
                    ├── controller/     # Controller tests
                    ├── service/        # Service tests
                    └── repository/     # Repository tests
```

## Key Features to Implement

### Admin Functionality
- User management (CRUD operations)
- Job listing approval/rejection
- System settings management
- Dashboard with statistics and monitoring

### Employer Functionality
- Job posting creation and management
- Application review and management
- Candidate communication
- Job posting history and analytics

### Job Seeker Functionality
- Job search and filtering
- Job application with resume/cover letter
- Application tracking
- Profile management
- Job recommendations

## API Endpoints (Typical)
```
# Auth
POST /api/auth/login
POST /api/auth/logout

# Users
GET /api/users
POST /api/users
GET /api/users/{id}
PUT /api/users/{id}
DELETE /api/users/{id}

# Jobs
GET /api/jobs
POST /api/jobs
GET /api/jobs/{id}
PUT /api/jobs/{id}
DELETE /api/jobs/{id}
GET /api/jobs/{id}/applications

# Applications
GET /api/applications
POST /api/applications
GET /api/applications/{id}
PUT /api/applications/{id}
```

## Development Guidelines
1. Follow REST API design principles
2. Use appropriate HTTP status codes
3. Implement proper validation and error handling
4. Write unit tests for service and controller layers
5. Keep controllers thin; move business logic to services
6. Use DTOs to avoid exposing internal entities
7. Secure endpoints with appropriate authentication/authorization
8. Follow Java naming conventions and code style
9. Document complex logic with comments
10. Use meaningful commit messages

## Database Design (Typical Tables)
- users (id, name, email, password, role, created_at, updated_at)
- job_listings (id, title, description, requirements, salary, employer_id, status, created_at, updated_at)
- applications (id, job_seeker_id, job_listing_id, resume, cover_letter, status, applied_at, updated_at)
- user_sessions (for tracking active sessions)
- system_settings (key, value, description)

## Environment Configuration
Create `application.properties` or `application.yml` in `src/main/resources/`:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/jobportal
spring.datasource.username=root
spring.datasource.password=password

# Server
server.port=8080

# JWT (if using token-based auth)
jwt.secret=your-secret-key
jwt.expiration=86400000

# File upload
upload.path=/var/uploads
max.file.size=10MB
```

## Testing Strategy
- **Unit Tests**: Test individual methods in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **Mock External Services**: Use Mockito for mocking dependencies
- **Test Data**: Use factory methods or builders for test data
- **Continuous Integration**: Run tests on every push

## Deployment
1. Build JAR/WAR: `mvn clean package`
2. Deploy to server (Tomcat, Jetty, or cloud platform)
3. Configure environment variables for production
4. Set up database backups and monitoring
5. Configure SSL/HTTPS for production

## Troubleshooting
- **Port already in use**: Change server.port or stop existing process
- **Database connection failed**: Check DB URL, credentials, and DB server status
- **Missing dependencies**: Run `mvn clean install` to download dependencies
- **OutOfMemoryError**: Increase JVM heap size with `-Xmx` flag
- **404 Errors**: Check URL mappings and controller annotations
- **500 Errors**: Check application logs for stack traces