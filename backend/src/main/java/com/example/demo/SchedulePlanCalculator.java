package com.example.demo;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Pure calendar logic: one credit = 15 periods; one meeting = 3 periods. */
public final class SchedulePlanCalculator {
    private SchedulePlanCalculator() {}

    public record Plan(LocalDate firstDate, LocalDate lastDate, List<LocalDate> dates) {}

    public static DayOfWeek weekday(String name) {
        return switch (name) {
            case "Thứ 2" -> DayOfWeek.MONDAY;
            case "Thứ 3" -> DayOfWeek.TUESDAY;
            case "Thứ 4" -> DayOfWeek.WEDNESDAY;
            case "Thứ 5" -> DayOfWeek.THURSDAY;
            case "Thứ 6" -> DayOfWeek.FRIDAY;
            case "Thứ 7" -> DayOfWeek.SATURDAY;
            case "Chủ nhật" -> DayOfWeek.SUNDAY;
            default -> throw new IllegalArgumentException("Thứ học không hợp lệ: " + name);
        };
    }

    public static Plan calculate(LocalDate start, Collection<String> weekdayNames, int credits) {
        if (start == null) throw new IllegalArgumentException("Chưa chọn ngày bắt đầu");
        if (credits < 1 || credits > 10) throw new IllegalArgumentException("Số tín chỉ phải từ 1 đến 10");
        if (weekdayNames == null || weekdayNames.isEmpty() || weekdayNames.size() > 7)
            throw new IllegalArgumentException("Chọn từ 1 đến 7 thứ học trong tuần");
        Set<DayOfWeek> selected = new HashSet<>();
        for (String name : weekdayNames) {
            if (name == null || !selected.add(weekday(name)))
                throw new IllegalArgumentException("Các thứ học không được trùng nhau");
        }
        int meetings = credits * 15 / 3;
        if (selected.size() > meetings) throw new IllegalArgumentException("Số ngày học/tuần không được lớn hơn tổng số buổi học");
        List<LocalDate> dates = new ArrayList<>(meetings);
        LocalDate date = start;
        while (dates.size() < meetings) {
            if (selected.contains(date.getDayOfWeek())) dates.add(date);
            date = date.plusDays(1);
        }
        return new Plan(dates.get(0), dates.get(dates.size() - 1), List.copyOf(dates));
    }
}
