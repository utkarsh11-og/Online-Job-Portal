package com.company.jobportal.service;

import com.company.jobportal.dto.MessageRequest;
import com.company.jobportal.model.JobListing;
import com.company.jobportal.model.Message;
import com.company.jobportal.model.User;
import com.company.jobportal.repository.JobListingRepository;
import com.company.jobportal.repository.MessageRepository;
import com.company.jobportal.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JobListingRepository jobListingRepository;
    private final ActivityLogService activityLogService;

    public MessageServiceImpl(MessageRepository messageRepository,
                              UserRepository userRepository,
                              JobListingRepository jobListingRepository,
                              ActivityLogService activityLogService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.jobListingRepository = jobListingRepository;
        this.activityLogService = activityLogService;
    }

    @Override
    public Message sendMessage(User sender, MessageRequest request) {
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found with ID: " + request.getReceiverId()));

        JobListing jobListing = null;
        if (request.getJobListingId() != null) {
            jobListing = jobListingRepository.findById(request.getJobListingId()).orElse(null);
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setJobListing(jobListing);
        message.setContent(request.getContent());

        Message saved = messageRepository.save(message);
        activityLogService.logActivity(sender.getEmail(), sender.getRole(),
                "MESSAGE_SENT", "Sent message to " + receiver.getName());
        return saved;
    }

    @Override
    public List<Message> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }

    @Override
    public List<User> getRecentContacts(Long userId) {
        List<Long> contactIds = messageRepository.findDistinctContactUserIds(userId);
        List<User> contacts = new ArrayList<>();
        for (Long id : contactIds) {
            if (!id.equals(userId)) {
                userRepository.findById(id).ifPresent(contacts::add);
            }
        }
        return contacts;
    }

    @Override
    public List<Message> getInbox(Long userId) {
        return messageRepository.findByReceiverIdOrderBySentAtDesc(userId);
    }
}
