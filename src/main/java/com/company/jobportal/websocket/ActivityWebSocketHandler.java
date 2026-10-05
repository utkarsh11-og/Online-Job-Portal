package com.company.jobportal.websocket;

import com.company.jobportal.model.ActivityLog;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

@Component
public class ActivityWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(ActivityWebSocketHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    // Thread-safe list of active sessions
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        logger.info("New WebSocket session connected: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        sessions.remove(session);
        logger.info("WebSocket session closed: {} with status: {}", session.getId(), status);
    }

    /**
     * Broadcast activity log to all connected clients
     */
    public void broadcastActivity(ActivityLog activity) {
        try {
            String json = objectMapper.writeValueAsString(activity);
            TextMessage message = new TextMessage(json);

            // Create a copy of sessions to avoid ConcurrentModificationException
            List<WebSocketSession> sessionCopy = new CopyOnWriteArrayList<>(sessions);
            for (WebSocketSession session : sessionCopy) {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(message);
                    }
                } catch (IOException e) {
                    logger.error("Error sending activity to WebSocket session {}", session.getId(), e);
                    // Remove broken session
                    sessions.remove(session);
                }
            }
        } catch (IOException e) {
            logger.error("Error broadcasting activity to WebSocket clients", e);
        }
    }
}