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

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}