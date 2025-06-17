package com.lifebit.coreapi.entity;

public enum UserRole {
    ADMIN,
    USER;

    @Override
    public String toString() {
        return name();
    }
} 