package com.company.jobportal.service;

import com.company.jobportal.model.User;

public interface AuthService {
    User registerUser(User user);
    String loginUser(String email, String password);
}