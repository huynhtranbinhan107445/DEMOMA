package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class SchedulePlanCalculatorTest {
 @Test void threeCreditsThreeDaysPerWeek() {
  var plan=SchedulePlanCalculator.calculate(LocalDate.of(2026,11,9),List.of("Thứ 2","Thứ 4","Thứ 6"),3);
  assertEquals(15,plan.dates().size());
  assertEquals(LocalDate.of(2026,11,9),plan.firstDate());
  assertEquals(LocalDate.of(2026,12,11),plan.lastDate());
 }
 @Test void threeCreditsTwoDaysPerWeek() {
  var plan=SchedulePlanCalculator.calculate(LocalDate.of(2026,11,9),List.of("Thứ 2","Thứ 4"),3);
  assertEquals(15,plan.dates().size());
  assertEquals(LocalDate.of(2026,12,28),plan.lastDate());
 }
 @Test void oneCreditTwoDaysPerWeek() {
  var plan=SchedulePlanCalculator.calculate(LocalDate.of(2026,11,9),List.of("Thứ 3","Thứ 5"),1);
  assertEquals(5,plan.dates().size());
  assertEquals(LocalDate.of(2026,11,10),plan.firstDate());
  assertEquals(LocalDate.of(2026,11,24),plan.lastDate());
 }
 @Test void rejectsDuplicateOrExcessiveWeekdays() {
  assertThrows(IllegalArgumentException.class,()->SchedulePlanCalculator.calculate(LocalDate.now(),List.of("Thứ 2","Thứ 2"),3));
  assertThrows(IllegalArgumentException.class,()->SchedulePlanCalculator.calculate(LocalDate.now(),List.of("Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"),1));
 }
}
