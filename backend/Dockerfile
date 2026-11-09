# Render: Root Directory = backend, Runtime = Docker
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /build/target/demo-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "exec java -jar /app/app.jar"]
