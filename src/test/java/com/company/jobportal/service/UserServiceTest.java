package com.company.jobportal.service;

import com.company.jobportal.model.User;
import com.company.jobportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("Jane Doe");
        sampleUser.setEmail("jane@example.com");
        sampleUser.setPassword("plainPass123");
        sampleUser.setRole("JOB_SEEKER");
        sampleUser.setSkills("Java, Spring Boot");
    }

    @Test
    void createUser_EncodesPasswordAndSaves() {
        when(passwordEncoder.encode("plainPass123")).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User created = userService.createUser(sampleUser);

        assertNotNull(created);
        assertEquals("encodedPass", created.getPassword());
        verify(passwordEncoder, times(1)).encode("plainPass123");
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void getUserById_Found() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        Optional<User> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals("Jane Doe", result.get().getName());
    }

    @Test
    void getUserById_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserById(99L);

        assertFalse(result.isPresent());
    }

    @Test
    void getUserByEmail_Found() {
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(sampleUser));

        Optional<User> result = userService.getUserByEmail("jane@example.com");

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getAllUsers_ReturnsList() {
        User user2 = new User();
        user2.setId(2L);
        user2.setName("Bob Smith");

        when(userRepository.findAll()).thenReturn(Arrays.asList(sampleUser, user2));

        List<User> list = userService.getAllUsers();

        assertEquals(2, list.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void updateUser_EncodesPasswordWhenProvided() {
        sampleUser.setPassword("newPass456");
        when(passwordEncoder.encode("newPass456")).thenReturn("encodedNewPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updated = userService.updateUser(sampleUser);

        assertEquals("encodedNewPass", updated.getPassword());
        verify(passwordEncoder, times(1)).encode("newPass456");
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void deleteUser_CallsRepositoryDelete() {
        doNothing().when(userRepository).deleteById(1L);

        userService.deleteUser(1L);

        verify(userRepository, times(1)).deleteById(1L);
    }
}
