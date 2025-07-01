package com.lifebit.coreapi.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BadgeTypeConverter implements AttributeConverter<BadgeType, String> {

    @Override
    public String convertToDatabaseColumn(BadgeType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public BadgeType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return BadgeType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            // 알 수 없는 값은 LEGACY bronze 로 매핑
            return BadgeType.bronze;
        }
    }
} 