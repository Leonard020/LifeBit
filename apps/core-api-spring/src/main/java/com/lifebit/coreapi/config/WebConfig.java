package com.lifebit.coreapi.config; // <-- 정확히 일치해야 합니다.

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration; // <-- 이 어노테이션이 있어야 합니다.
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String resourcePath = "file:" + uploadPath.toAbsolutePath().toString() + "/";

        registry.addResourceHandler("/" + uploadDir + "**")
                .addResourceLocations(resourcePath);
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // 모든 API 엔드포인트에 대한 CORS 설정
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
                
        // Actuator 엔드포인트에 대한 명시적 CORS 설정
        registry.addMapping("/actuator/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
                
        // 루트 경로에 대한 CORS 설정
        registry.addMapping("/")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}