package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter @Setter
public class MealRecordRequest {
    private Long foodItemId;
    private BigDecimal quantity;
} 