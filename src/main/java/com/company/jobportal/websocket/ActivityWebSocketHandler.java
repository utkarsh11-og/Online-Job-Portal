package com.company.jobportal.websocket;

import com.company.jobportal.model.ActivityLog;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.CopyOnWriteArrayList;
import java.util.List;

@Component
public class ActivityWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(ActivityWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
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

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
        } catch (IOException e) {
            logger.error("Error broadcasting activity to WebSocket clients", e);
        }
    }
}