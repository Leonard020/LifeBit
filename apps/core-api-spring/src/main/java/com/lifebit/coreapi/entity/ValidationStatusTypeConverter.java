package com.lifebit.coreapi.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ValidationStatusTypeConverter implements AttributeConverter<ValidationStatusType, String> {

    @Override
    public String convertToDatabaseColumn(ValidationStatusType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public ValidationStatusType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return ValidationStatusType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            return ValidationStatusType.PENDING;
        }
    }
} 