package com.company.jobportal.service;

import com.company.jobportal.dto.MessageRequest;
import com.company.jobportal.model.Message;
import com.company.jobportal.model.User;

import java.util.List;

public interface MessageService {
    Message sendMessage(User sender, MessageRequest request);
    List<Message> getConversation(Long userId1, Long userId2);
    List<User> getRecentContacts(Long userId);
    List<Message> getInbox(Long userId);
}
