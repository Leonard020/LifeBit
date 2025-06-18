package com.lifebit.coreapi.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MealTimeTypeConverter implements AttributeConverter<MealTimeType, String> {

    @Override
    public String convertToDatabaseColumn(MealTimeType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public MealTimeType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return MealTimeType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            // 기본값 반환 또는 예외 처리
            return MealTimeType.breakfast;
        }
    }
} 