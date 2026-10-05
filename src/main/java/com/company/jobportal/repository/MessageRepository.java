package com.company.jobportal.repository;

import com.company.jobportal.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) " +
           "OR (m.sender.id = :user2 AND m.receiver.id = :user1) ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);

    List<Message> findByReceiverIdOrderBySentAtDesc(Long receiverId);

    List<Message> findBySenderIdOrderBySentAtDesc(Long senderId);

    @Query("SELECT DISTINCT m.receiver.id FROM Message m WHERE m.sender.id = :userId UNION " +
           "SELECT DISTINCT m.sender.id FROM Message m WHERE m.receiver.id = :userId")
    List<Long> findDistinctContactUserIds(@Param("userId") Long userId);
}
