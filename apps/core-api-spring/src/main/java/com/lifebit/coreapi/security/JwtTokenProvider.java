package com.lifebit.coreapi.security;

import com.lifebit.coreapi.config.JwtConfig;
import com.lifebit.coreapi.entity.User;
import io.jsonwebtoken.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {
    private final JwtConfig jwtConfig;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getExpiration() * 1000);

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getUserId())
                .claim("role", user.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(jwtConfig.secretKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtConfig.secretKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(jwtConfig.secretKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(jwtConfig.secretKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
} 