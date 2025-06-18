package com.lifebit.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

public class UserDTO {
    private String id;
    private String password;
    private String email;
    private String nickname;
    private String role;
    @JsonProperty("createdAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private java.time.LocalDateTime createdAt;
    @JsonProperty("lastVisited")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private java.time.LocalDateTime lastVisited;

    public UserDTO(String id, String password, String email, String nickname, String role, java.time.LocalDateTime createdAt, java.time.LocalDateTime lastVisited) {
        this.id = id;
        this.password = password;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
        this.createdAt = createdAt;
        this.lastVisited = lastVisited;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getLastVisited() {
        return lastVisited;
    }

    public void setLastVisited(java.time.LocalDateTime lastVisited) {
        this.lastVisited = lastVisited;
    }
} 