package com.lifebit.coreapi.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BodyPartTypeConverter implements AttributeConverter<BodyPartType, String> {

    @Override
    public String convertToDatabaseColumn(BodyPartType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public BodyPartType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return BodyPartType.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            return BodyPartType.chest;
        }
    }
} 