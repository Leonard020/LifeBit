package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UserProfileUpdateRequest {
    private String nickname;
    private String password;
    private BigDecimal height;
    private BigDecimal weight;
    private Integer age;
    private String gender;
    private Boolean removeProfileImage;
} 