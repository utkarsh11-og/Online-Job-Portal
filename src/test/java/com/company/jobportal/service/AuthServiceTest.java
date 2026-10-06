package com.company.jobportal.service;

import com.company.jobportal.model.User;
import com.company.jobportal.security.JwtUtils;
import com.company.jobportal.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("Alice");
        sampleUser.setEmail("alice@test.com");
        sampleUser.setPassword("securePass123");
        sampleUser.setRole("EMPLOYER");
    }

    @Test
    void registerUser_Success() {
        when(userService.getUserByEmail("alice@test.com")).thenReturn(Optional.empty());
        when(userService.createUser(any(User.class))).thenReturn(sampleUser);

        User registered = authService.registerUser(sampleUser);

        assertNotNull(registered);
        assertEquals("alice@test.com", registered.getEmail());
        verify(userService, times(1)).createUser(sampleUser);
    }

    @Test
    void registerUser_DuplicateEmail_ThrowsException() {
        when(userService.getUserByEmail("alice@test.com")).thenReturn(Optional.of(sampleUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(sampleUser);
        });

        assertTrue(ex.getMessage().contains("User already exists"));
        verify(userService, never()).createUser(any(User.class));
    }

    @Test
    void loginUser_Success() {
        UserDetails userDetails = new UserDetailsImpl(sampleUser);
        when(userService.loadUserByUsername("alice@test.com")).thenReturn(userDetails);
        when(passwordEncoder.matches("securePass123", sampleUser.getPassword())).thenReturn(true);
        when(jwtUtils.generateToken(userDetails)).thenReturn("jwt.token.mock");

        String token = authService.loginUser("alice@test.com", "securePass123");

        assertEquals("jwt.token.mock", token);
        verify(jwtUtils, times(1)).generateToken(userDetails);
    }

    @Test
    void loginUser_InvalidPassword_ThrowsException() {
        UserDetails userDetails = new UserDetailsImpl(sampleUser);
        when(userService.loadUserByUsername("alice@test.com")).thenReturn(userDetails);
        when(passwordEncoder.matches("wrongPass", sampleUser.getPassword())).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.loginUser("alice@test.com", "wrongPass");
        });

        assertEquals("Invalid credentials", ex.getMessage());
        verify(jwtUtils, never()).generateToken(any());
    }
}
