package com.company.jobportal.service;

import com.company.jobportal.model.User;
import com.company.jobportal.security.JwtUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserService userService;
    private final JwtUtils jwtUtils;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserService userService, JwtUtils jwtUtils, BCryptPasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User registerUser(User user) {
        // Check if user already exists by email
        if (userService.getUserByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with email: " + user.getEmail());
        }
        // Password will be encoded by UserService.createUser
        return userService.createUser(user);
    }

    @Override
    public String loginUser(String email, String password) {
        // Load user by email (username)
        UserDetails userDetails = userService.loadUserByUsername(email);
        // Check password
        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        // Generate JWT token
        return jwtUtils.generateToken(userDetails);
    }
}