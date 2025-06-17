package com.lifebit.coreapi.controller;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthCheckController {
    private final UserRepository userRepository;
    
    @GetMapping("/")
    public Map<String, String> healthCheck() {
        return Map.of("status", "OK", "service", "Core-API");
    }
    
    @GetMapping("/api/health/db")
    public Map<String, Object> dbHealthCheck() {
        try {
            long userCount = userRepository.count();
            return Map.of(
                "status", "OK", 
                "database", "Connected",
                "userCount", userCount
            );
        } catch (Exception e) {
            return Map.of(
                "status", "ERROR", 
                "database", "Connection Failed",
                "error", e.getMessage()
            );
        }
    }
    
    @GetMapping("/api/health/hash/{password}")
    public Map<String, String> generatePasswordHash(@PathVariable String password) {
        try {
            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = 
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            String hash = encoder.encode(password);
            return Map.of(
                "password", password,
                "hash", hash
            );
        } catch (Exception e) {
            return Map.of(
                "error", e.getMessage()
            );
        }
    }
}