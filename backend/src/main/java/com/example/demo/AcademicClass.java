package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "academic_classes")
public class AcademicClass {
    @Id private String id;
    private String code;
    private String facultyId;
    private String cohort;
    private String section;
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }
    public String getCohort() { return cohort; }
    public void setCohort(String cohort) { this.cohort = cohort; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
}
