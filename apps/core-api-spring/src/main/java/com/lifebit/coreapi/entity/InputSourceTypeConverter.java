package com.lifebit.coreapi.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InputSourceTypeConverter implements AttributeConverter<InputSourceType, String> {

    @Override
    public String convertToDatabaseColumn(InputSourceType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public InputSourceType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return InputSourceType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            return InputSourceType.TYPING;
        }
    }
} 