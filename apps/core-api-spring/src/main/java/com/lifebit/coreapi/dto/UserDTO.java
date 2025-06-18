package com.lifebit.coreapi.dto;

public class UserDTO {
    private String id;
    private String password;
    private String email;
    private String nickname;
    private String role;

    public UserDTO(String id, String password, String email, String nickname, String role) {
        this.id = id;
        this.password = password;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
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
} 