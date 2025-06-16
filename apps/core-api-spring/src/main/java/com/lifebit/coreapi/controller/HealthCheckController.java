package com.lifebit.coreapi.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
@RestController
public class HealthCheckController {
    @GetMapping("/")
    public Map<String, String> healthCheck() {
        return Map.of("status", "OK", "service", "Core-API");
    }
}