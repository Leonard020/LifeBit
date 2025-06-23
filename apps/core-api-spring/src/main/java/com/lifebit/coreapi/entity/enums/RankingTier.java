package com.lifebit.coreapi.entity.enums;

public enum RankingTier {
    UNRANK,
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM,
    DIAMOND,
    MASTER,
    GRANDMASTER,
    CHALLENGER;

    public String getIconName() {
        switch (this) {
            case BRONZE: return "bronze-medal";
            case SILVER: return "silver-medal";
            case GOLD: return "gold-medal";
            case PLATINUM: return "platinum-medal";
            case DIAMOND: return "diamond-medal";
            case MASTER: return "master-medal";
            case GRANDMASTER: return "grandmaster-medal";
            case CHALLENGER: return "challenger-medal";
            default: return "unranked-medal";
        }
    }

    public String getColorCode() {
        switch (this) {
            case BRONZE: return "#cd7f32";
            case SILVER: return "#c0c0c0";
            case GOLD: return "#ffd700";
            case PLATINUM: return "#e5e4e2";
            case DIAMOND: return "#00bfff";
            case MASTER: return "#a020f0";
            case GRANDMASTER: return "#ff4500";
            case CHALLENGER: return "#ff1493";
            default: return "#bdbdbd";
        }
    }

    public String getKoreanName() {
        switch (this) {
            case BRONZE: return "브론즈";
            case SILVER: return "실버";
            case GOLD: return "골드";
            case PLATINUM: return "플래티넘";
            case DIAMOND: return "다이아";
            case MASTER: return "마스터";
            case GRANDMASTER: return "그랜드마스터";
            case CHALLENGER: return "챌린저";
            default: return "언랭크";
        }
    }
} 