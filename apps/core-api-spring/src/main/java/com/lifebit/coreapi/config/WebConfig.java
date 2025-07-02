package com.lifebit.coreapi.config; // <-- 정확히 일치해야 합니다.

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration; // <-- 이 어노테이션이 있어야 합니다.
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.env.Environment;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;
    
    private final Environment environment;
    
    public WebConfig(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String resourcePath = "file:" + uploadPath.toAbsolutePath().toString() + "/";

        registry.addResourceHandler("/" + uploadDir + "**")
                .addResourceLocations(resourcePath);
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // 프로덕션 환경 감지
        boolean isProduction = Arrays.asList(environment.getActiveProfiles()).contains("production");
        
        if (isProduction) {
            // 프로덕션: 환경변수에서 허용 도메인 가져오기
            String corsOrigins = environment.getProperty("CORS_ORIGINS", "");
            String[] allowedOrigins;
            
            if (!corsOrigins.isEmpty()) {
                allowedOrigins = corsOrigins.split(",");
                for (int i = 0; i < allowedOrigins.length; i++) {
                    allowedOrigins[i] = allowedOrigins[i].trim();
                }
            } else {
                // 기본 프로덕션 설정 (동적으로 설정됨)
                String domainName = environment.getProperty("DOMAIN_NAME", "localhost");
                allowedOrigins = new String[]{
                    "http://" + domainName,
                    "http://" + domainName + ":3000",
                    "http://" + domainName + ":80"
                };
            }
            
            registry.addMapping("/**")
                    .allowedOrigins(allowedOrigins)
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
                    
            System.out.println("[CORS] Production mode - Allowed origins: " + Arrays.toString(allowedOrigins));
        } else {
            // 로컬 개발: 기존과 동일 (모든 도메인 허용)
            registry.addMapping("/**")
                    .allowedOriginPatterns("*")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
                    
            System.out.println("[CORS] Development mode - All origins allowed");
        }
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}