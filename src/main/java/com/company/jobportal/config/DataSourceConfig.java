package com.company.jobportal.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${PGHOST:#{null}}")
    private String pgHost;

    @Value("${PGPORT:5432}")
    private String pgPort;

    @Value("${PGDATABASE:#{null}}")
    private String pgDatabase;

    @Value("${PGUSER:#{null}}")
    private String pgUser;

    @Value("${PGPASSWORD:#{null}}")
    private String pgPassword;

    @Value("${PGSSLMODE:require}")
    private String pgSslMode;

    @Value("${spring.datasource.url:jdbc:h2:mem:jobportal}")
    private String defaultUrl;

    @Value("${spring.datasource.username:sa}")
    private String defaultUsername;

    @Value("${spring.datasource.password:password}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        if (databaseUrl != null && !databaseUrl.isBlank()) {
            logger.info("Configuring DataSource from DATABASE_URL");
            try {
                if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                    URI uri = new URI(databaseUrl.replace("postgres://", "postgresql://"));
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    String query = uri.getQuery();
                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");

                    config.setJdbcUrl(jdbcUrl);
                    if (uri.getUserInfo() != null) {
                        String[] parts = uri.getUserInfo().split(":", 2);
                        config.setUsername(parts[0]);
                        if (parts.length > 1) {
                            config.setPassword(parts[1]);
                        }
                    }
                    config.setDriverClassName("org.postgresql.Driver");
                } else {
                    config.setJdbcUrl(databaseUrl);
                }
            } catch (Exception e) {
                logger.error("Error parsing DATABASE_URL, using raw value: {}", e.getMessage());
                config.setJdbcUrl(databaseUrl);
            }
        } else if (pgHost != null && !pgHost.isBlank()) {
            logger.info("Configuring DataSource from PGHOST/PG* variables");
            String sslQuery = (pgSslMode != null && !pgSslMode.isBlank()) ? "?sslmode=" + pgSslMode : "";
            config.setJdbcUrl("jdbc:postgresql://" + pgHost + ":" + pgPort + "/" + pgDatabase + sslQuery);
            config.setUsername(pgUser);
            config.setPassword(pgPassword);
            config.setDriverClassName("org.postgresql.Driver");
        } else {
            logger.info("Using default local DataSource: {}", defaultUrl);
            config.setJdbcUrl(defaultUrl);
            config.setUsername(defaultUsername);
            config.setPassword(defaultPassword);
            config.setDriverClassName("org.h2.Driver");
        }

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}
