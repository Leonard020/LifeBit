package com.lifebit.coreapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
        throws ServletException, IOException {
    try {
        String jwt = getJwtFromRequest(request);
        String requestURI = request.getRequestURI();

        log.debug("Processing request: {} with JWT: {}", requestURI, jwt != null ? "Present" : "None");

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            Long userId = tokenProvider.getUserIdFromToken(jwt);
            Claims claims = tokenProvider.getAllClaimsFromToken(jwt);
            String role = claims.get("role", String.class);
            String authority = "ROLE_USER";

            // Ensure role matches the user_role ENUM type
            if (role != null) {
                switch (role.toUpperCase()) {
                    case "ADMIN":
                        authority = "ROLE_ADMIN";
                        break;
                    case "USER":
                        authority = "ROLE_USER";
                        break;
                    default:
                        logger.warn("Invalid role value in JWT: {}", role);
                        authority = "ROLE_USER";
                }
            }

            logger.info("JWT role claim: {} | Setting authority: {}", role, authority);

            // ✅ principal에 userId를 가진 UserDetails 객체 생성
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                userId.toString(), "", List.of(new SimpleGrantedAuthority(authority))
            );

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } else if (StringUtils.hasText(jwt)) {
            log.warn("JWT validation failed for request: {}", requestURI);
        } else {
            log.debug("No JWT token found for request: {}", requestURI);
        }
    } catch (Exception ex) {
        log.error("Could not set user authentication in security context", ex);
    }

    filterChain.doFilter(request, response);
}

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
} 