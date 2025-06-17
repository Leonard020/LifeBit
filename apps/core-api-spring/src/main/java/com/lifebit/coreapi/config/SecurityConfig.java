package com.lifebit.coreapi.config;

import com.lifebit.coreapi.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http)) // CORS 활성화
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**", 
                    "/actuator/**", 
                    "/",
                    "/api/health/**"             // 헬스체크 API
                ).permitAll()
                .requestMatchers(
                    "/api/users/**",             // 사용자 프로필 API (인증 필요)
                    "/api/health-statistics/**", // 건강 통계 API (인증 필요)
                    "/api/health-records/**",    // 건강 기록 API (인증 필요)
                    "/api/user-goals/**",        // 사용자 목표 API (인증 필요)
                    "/api/recommendations/**",   // 추천 API (인증 필요)
                    "/api/exercise-sessions/**", // 운동 세션 API (인증 필요)
                    "/api/meal-logs/**"          // 식단 기록 API (인증 필요)
                ).authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
} 