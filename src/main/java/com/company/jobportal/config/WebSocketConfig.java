package com.company.jobportal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ActivityWebSocketHandler activityWebSocketHandler;

    public WebSocketConfig(ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(activityWebSocketHandler, "/ws/activity")
                .setAllowedOrigins("*") // In production, restrict to your domain
                .addInterceptors(new HttpSessionHandshakeInterceptor(), new AuthenticationHandshakeInterceptor());
    }
}