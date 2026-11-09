package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/** MongoDB: giu ten truong cu de doc duoc du lieu graduation_conditions hien co. */
@Document(collection = "graduation_conditions")
public class GraduationCondition {
    @Id private String id;
    private String cohort;
    private Integer requiredCredits;
    private Double minGpa;
    private Integer maximumFailedCourses;
    private Boolean foreignLanguageRequired;
    private Boolean itCertificateRequired;
    private Boolean conductRequired;
    private String foreignLanguageStandard;
    private String itStandard;
    private String conductStandard;
    private Boolean isActive;
    private Boolean deleted;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String v) { id=v; }
    public String getCohort() { return cohort; }
    public void setCohort(String v) { cohort=v; }
    public Integer getRequiredCredits() { return requiredCredits; }
    public void setRequiredCredits(Integer v) { requiredCredits=v; }
    public Double getMinGpa() { return minGpa; }
    public void setMinGpa(Double v) { minGpa=v; }
    public Integer getMaximumFailedCourses() { return maximumFailedCourses; }
    public void setMaximumFailedCourses(Integer v) { maximumFailedCourses=v; }
    public Boolean getForeignLanguageRequired() { return foreignLanguageRequired != null ? foreignLanguageRequired : hasStandard(foreignLanguageStandard); }
    public void setForeignLanguageRequired(Boolean v) { foreignLanguageRequired=v; }
    public Boolean getItCertificateRequired() { return itCertificateRequired != null ? itCertificateRequired : hasStandard(itStandard); }
    public void setItCertificateRequired(Boolean v) { itCertificateRequired=v; }
    public Boolean getConductRequired() { return conductRequired != null ? conductRequired : hasStandard(conductStandard); }
    public void setConductRequired(Boolean v) { conductRequired=v; }
    private boolean hasStandard(String value) {
        if (value == null || value.isBlank()) return false;
        String normalized=value.trim().toLowerCase(java.util.Locale.ROOT);
        return !normalized.equals("không yêu cầu") && !normalized.equals("khong yeu cau") && !normalized.equals("không");
    }
    public String getForeignLanguageStandard() { return foreignLanguageStandard; }
    public void setForeignLanguageStandard(String v) { foreignLanguageStandard=v; }
    public String getItStandard() { return itStandard; }
    public void setItStandard(String v) { itStandard=v; }
    public String getConductStandard() { return conductStandard; }
    public void setConductStandard(String v) { conductStandard=v; }
    public Boolean getIsActive() { return isActive == null ? Boolean.TRUE : isActive; }
    public void setIsActive(Boolean v) { isActive=v; }
    public Boolean getDeleted() { return Boolean.TRUE.equals(deleted); }
    public void setDeleted(Boolean v) { deleted=v; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime v) { deletedAt=v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { createdAt=v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { updatedAt=v; }
}
