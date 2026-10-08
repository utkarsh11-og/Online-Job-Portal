package com.company.jobportal.config;

import com.company.jobportal.model.Application;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.Message;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.ApplicationRepository;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.MessageRepository;
import com.company.jobportal.repository.UserRepository;
import com.company.jobportal.service.ActivityLogService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final JobListingRepository jobListingRepository;
    private final ApplicationRepository applicationRepository;
    private final MessageRepository messageRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    public DataInitializer(UserRepository userRepository,
                           JobListingRepository jobListingRepository,
                           ApplicationRepository applicationRepository,
                           MessageRepository messageRepository,
                           BCryptPasswordEncoder passwordEncoder,
                           ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.jobListingRepository = jobListingRepository;
        this.applicationRepository = applicationRepository;
        this.messageRepository = messageRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogService = activityLogService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Already initialized
        }

        // 1. Create Users
        User admin = new User();
        admin.setName("System Administrator");
        admin.setEmail("admin@jobportal.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole("ADMIN");
        admin.setHeadline("Portal Lead Administrator");
        admin = userRepository.save(admin);

        User employer1 = new User();
        employer1.setName("TechCorp Solutions");
        employer1.setEmail("employer@techcorp.com");
        employer1.setPassword(passwordEncoder.encode("employer123"));
        employer1.setRole("EMPLOYER");
        employer1.setHeadline("Leading Enterprise Cloud Solutions");
        employer1.setPhone("+91-98450-12345");
        employer1 = userRepository.save(employer1);

        User employer2 = new User();
        employer2.setName("Innovate Labs");
        employer2.setEmail("hr@innovatelabs.io");
        employer2.setPassword(passwordEncoder.encode("employer123"));
        employer2.setRole("EMPLOYER");
        employer2.setHeadline("Pioneering Next-Gen AI Applications");
        employer2.setPhone("+91-98100-67890");
        employer2 = userRepository.save(employer2);

        User seeker1 = new User();
        seeker1.setName("Alex Morgan");
        seeker1.setEmail("seeker@example.com");
        seeker1.setPassword(passwordEncoder.encode("seeker123"));
        seeker1.setRole("JOB_SEEKER");
        seeker1.setHeadline("Senior Full-Stack & Spring Boot Architect");
        seeker1.setSkills("Java, Spring Boot, Microservices, React, Docker, SQL, REST APIs");
        seeker1.setPhone("+91-98200-54321");
        seeker1 = userRepository.save(seeker1);

        User seeker2 = new User();
        seeker2.setName("Sarah Chen");
        seeker2.setEmail("sarah@example.com");
        seeker2.setPassword(passwordEncoder.encode("seeker123"));
        seeker2.setRole("JOB_SEEKER");
        seeker2.setHeadline("Data Scientist & Machine Learning Specialist");
        seeker2.setSkills("Python, PyTorch, SQL, Big Data, Machine Learning, Data Analytics");
        seeker2.setPhone("+91-98840-98765");
        seeker2 = userRepository.save(seeker2);

        // 2. Create Job Listings
        JobListing job1 = new JobListing();
        job1.setTitle("Senior Java Backend Engineer");
        job1.setCompanyName("TechCorp Solutions");
        job1.setDescription("We are seeking an experienced Java Engineer to build high-scale microservices and distributed transaction pipelines. You will collaborate with cloud architects and product managers to deliver enterprise-grade APIs.");
        job1.setRequirements("5+ years Java, Spring Boot, Spring Security, Hibernate, MySQL/PostgreSQL, Docker, RESTful APIs");
        job1.setSalary(1850000.0);
        job1.setLocation("Bengaluru, Karnataka / Remote");
        job1.setJobType("Full-time");
        job1.setEmployer(employer1);
        job1.setStatus("ACTIVE");
        job1.setApprovalStatus("APPROVED");
        job1 = jobListingRepository.save(job1);

        JobListing job2 = new JobListing();
        job2.setTitle("Full Stack Engineer (Java & React)");
        job2.setCompanyName("TechCorp Solutions");
        job2.setDescription("Design and implement responsive modern interfaces coupled with robust Spring Boot backend services. Drive end-to-end features from inception through automated deployment.");
        job2.setRequirements("Strong knowledge of Java 17+, React, TypeScript, Tailwind/CSS, Spring Data JPA, Git workflows");
        job2.setSalary(1450000.0);
        job2.setLocation("Hyderabad, Telangana / Hybrid");
        job2.setJobType("Full-time");
        job2.setEmployer(employer1);
        job2.setStatus("ACTIVE");
        job2.setApprovalStatus("APPROVED");
        job2 = jobListingRepository.save(job2);

        JobListing job3 = new JobListing();
        job3.setTitle("AI & Machine Learning Researcher");
        job3.setCompanyName("Innovate Labs");
        job3.setDescription("Join our research and product development team to fine-tune generative models, build autonomous agents, and evaluate NLP retrieval systems at scale.");
        job3.setRequirements("Python, PyTorch, Hugging Face, Vector Databases, Data Analysis, Cloud GPUs, PhD or MS in Computer Science preferred");
        job3.setSalary(2200000.0);
        job3.setLocation("Pune, Maharashtra / Remote");
        job3.setJobType("Full-time");
        job3.setEmployer(employer2);
        job3.setStatus("ACTIVE");
        job3.setApprovalStatus("APPROVED");
        job3 = jobListingRepository.save(job3);

        JobListing job4 = new JobListing();
        job4.setTitle("Cloud Infrastructure & DevOps Engineer");
        job4.setCompanyName("Innovate Labs");
        job4.setDescription("Own CI/CD pipelines, Kubernetes clusters, and cloud security compliance across multicloud production deployments.");
        job4.setRequirements("Kubernetes, Terraform, AWS/GCP, Docker, Linux administration, Prometheus & Grafana monitoring");
        job4.setSalary(1600000.0);
        job4.setLocation("Remote (India)");
        job4.setJobType("Contract");
        job4.setEmployer(employer2);
        job4.setStatus("ACTIVE");
        job4.setApprovalStatus("PENDING"); // Pending approval for testing admin dashboard
        job4 = jobListingRepository.save(job4);

        // 3. Create Applications
        Application app1 = new Application();
        app1.setJobSeeker(seeker1);
        app1.setJobListing(job1);
        app1.setCoverLetter("I have over 6 years of experience engineering scalable microservices with Spring Boot and distributed systems. Excited about TechCorp's mission!");
        app1.setStatus("SHORTLISTED");
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setJobSeeker(seeker2);
        app2.setJobListing(job3);
        app2.setCoverLetter("Passionate about generative AI models and data pipelines. Looking forward to discussing how my background aligns with Innovate Labs.");
        app2.setStatus("PENDING");
        applicationRepository.save(app2);

        // 4. Create Messages
        Message msg1 = new Message();
        msg1.setSender(employer1);
        msg1.setReceiver(seeker1);
        msg1.setJobListing(job1);
        msg1.setContent("Hi Alex! We reviewed your application for Senior Java Backend Engineer and were impressed with your background. Are you available for a call this week?");
        messageRepository.save(msg1);

        Message msg2 = new Message();
        msg2.setSender(seeker1);
        msg2.setReceiver(employer1);
        msg2.setJobListing(job1);
        msg2.setContent("Hi! Thank you for reaching out. Yes, I am available Wednesday or Thursday afternoon. Looking forward to speaking with the team!");
        messageRepository.save(msg2);

        // 5. Initial Activity Logs
        activityLogService.logActivity("admin@jobportal.com", "ADMIN", "SYSTEM_INIT", "System initialized with sample data");
        activityLogService.logActivity("employer@techcorp.com", "EMPLOYER", "JOB_POSTED", "Posted 'Senior Java Backend Engineer'");
        activityLogService.logActivity("seeker@example.com", "JOB_SEEKER", "APPLICATION_SUBMITTED", "Applied to 'Senior Java Backend Engineer'");
        activityLogService.logActivity("employer@techcorp.com", "EMPLOYER", "APPLICATION_STATUS_UPDATED", "Status updated to SHORTLISTED for Alex Morgan");
    }
}
