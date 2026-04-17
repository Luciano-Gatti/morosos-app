package com.tuorg.morososcontrol.shared.util;

public final class TextNormalizer {

    private TextNormalizer() {
    }

    public static String normalizeRequired(String value) {
        return value == null ? null : value.trim();
    }

    public static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
