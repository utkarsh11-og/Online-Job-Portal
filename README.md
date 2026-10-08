# JobSphere - Enterprise Job Portal Platform

A full-stack, enterprise-grade Online Job Portal application built with **Spring Boot**, **Spring Security**, **Spring Data JPA**, **Hibernate**, **WebSocket**, and modern frontend technologies.

JobSphere connects employers with top talent through dedicated, role-specific portals for **Job Seekers**, **Employers**, and **System Administrators**, backed by real-time activity tracking and interactive analytics.

---

## 🌟 Key Features

### 👤 Role-Based Access Control & Security
- **JWT (JSON Web Token) Authentication**: Stateless, secure token-based authentication with expiration controls.
- **BCrypt Password Encryption**: Strong salt-based password hashing.
- **Three Distinct User Roles**:
  - `ROLE_JOB_SEEKER`: Search, apply for jobs, upload resumes, and track application lifecycle.
  - `ROLE_EMPLOYER`: Post job listings, manage applicants, change application statuses, and message candidates.
  - `ROLE_ADMIN`: Platform-wide governance, user management, system configurations, and real-time activity monitoring.

### 💼 For Job Seekers
- **Dynamic Job Search & Filtering**: Search by keyword, role, location, job type (Full-time, Part-time, Contract, Remote), and salary.
- **Resume Upload**: Secure document uploading (PDF, DOCX) with UUID-based storage.
- **One-Click Applications**: Seamless application submission with cover letter support.
- **Application Status Tracking**: Live status updates (`APPLIED`, `UNDER_REVIEW`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`).
- **Direct Messaging**: Communicate directly with employers regarding applications.

### 🏢 For Employers
- **Job Posting & Lifecycle Management**: Create, edit, close, and archive job postings.
- **Applicant Pipeline Management**: Review applicant profiles, download attached resumes, and update recruitment stages.
- **Candidate Communication**: In-app messaging thread with applicants.
- **Application Statistics**: Overview of applicants per job and candidate engagement.

### 🛡️ For Administrators
- **User Management**: Search, edit, activate, or deactivate user accounts.
- **Job Moderation**: Review and govern all job postings across the platform.
- **System Settings Configuration**: Manage platform-wide operational settings dynamically.
- **Real-Time Activity Feed**: Live WebSocket feed tracking logins, applications, and job postings.
- **Interactive Visualizations**: Chart.js graphs displaying user engagement, application trends, and platform metrics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | Spring Boot 3.x / Java 21+ |
| **Security & Auth** | Spring Security 6, JJWT (io.jsonwebtoken:jjwt 0.11.5), BCrypt |
| **Data & Persistence** | Spring Data JPA, Hibernate, H2 Database (Dev), MySQL Connector (Prod) |
| **Real-Time** | Spring WebSocket (STOMP/SockJS/Raw WebSocket Handler) |
| **Testing** | JUnit 5, Mockito, Spring Boot Test, MockMvc (34 automated tests) |
| **Frontend** | HTML5, Modern CSS (Glassmorphism, Responsive Grid/Flexbox), Vanilla JavaScript (ES6+), Chart.js |
| **Build Tool** | Apache Maven |

---

## 🚀 Getting Started

### Prerequisites
- **Java Development Kit (JDK)**: Version 21 or higher
- **Maven**: Version 3.8+ (or use included wrapper if available)
- **Git**

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <REPOSITORY_URL>
   cd java_guvi_project_v1
   ```

2. **Build the project**:
   ```bash
   mvn clean install
   ```

3. **Run automated tests**:
   ```bash
   mvn test
   ```
   *(All 34 test cases across controllers and service layers run automatically)*

4. **Launch the application (Development Profile - H2 In-Memory)**:
   ```bash
   mvn spring-boot:run
   ```

5. **Access the portal**:
   - Web Application: [http://localhost:8081](http://localhost:8081)
   - H2 Database Console: [http://localhost:8081/h2-console](http://localhost:8081/h2-console)
     - JDBC URL: `jdbc:h2:mem:jobportal`
     - Username: `sa`
     - Password: `password`

---

## 👥 Default Demo Credentials

Pre-loaded sample accounts for evaluation:

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@jobportal.com` | `password` | Full system administrator access |
| **Employer** | `techcorp@company.com` | `password` | Cloud Enterprise employer account |
| **Employer** | `innovate@company.com` | `password` | AI/Tech startup employer account |
| **Job Seeker** | `john.dev@email.com` | `password` | Senior Java Developer profile |
| **Job Seeker** | `priya.data@email.com` | `password` | Data Scientist profile |

---

## 🌐 Production Deployment

To run with MySQL in a production environment:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Configure the following environment variables (or set them in `application-prod.properties`):
- `DB_HOST`: MySQL host (default: `localhost`)
- `DB_PORT`: MySQL port (default: `3306`)
- `DB_NAME`: Database name (default: `jobportal`)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secure 256-bit secret key

---

## 📂 Project Architecture

```
java_guvi_project_v1/
├── src/
│   ├── main/
│   │   ├── java/com/company/jobportal/
│   │   │   ├── config/          # Security, Web, Data Initializer, WebSocket configs
│   │   │   ├── controller/      # REST API endpoints (Auth, Admin, Jobs, Applications, etc.)
│   │   │   ├── model/           # JPA Entities (User, JobListing, Application, Message, etc.)
│   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   ├── security/        # JWT Filter, Token Provider, UserDetailsService
│   │   │   ├── service/         # Business logic layer and implementations
│   │   │   └── websocket/       # Real-time WebSocket handlers & interceptors
│   │   └── resources/
│   │       ├── application.properties        # Dev configuration (H2)
│   │       ├── application-prod.properties   # Production configuration (MySQL)
│   │       └── static/          # Web frontend (HTML, CSS, JS, Chart.js)
│   └── test/                    # Automated Unit & Integration test suite
├── uploads/                     # Resume file storage (git-ignored)
├── pom.xml                      # Maven build descriptor
└── README.md                    # Project documentation
```

---

## 📄 License
This project is developed for educational and demonstration purposes.
