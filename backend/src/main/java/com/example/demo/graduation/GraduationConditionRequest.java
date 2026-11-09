package com.example.demo.graduation;

import com.fasterxml.jackson.annotation.JsonAlias;

/** Input theo ten truong cua mau Nhom 11; chap nhan ten cu khi can. */
public record GraduationConditionRequest(
    String cohort,
    @JsonAlias("requiredCredits") Integer minimumCredits,
    @JsonAlias("minGpa") Double minimumGpa,
    Integer maximumFailedCourses,
    Boolean foreignLanguageRequired,
    Boolean itCertificateRequired,
    Boolean conductRequired,
    String foreignLanguageStandard,
    String itStandard,
    String conductStandard
) {}
