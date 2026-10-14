FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend-java/pom.xml ./pom.xml
COPY backend-java/src ./src
RUN mvn -B package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system spring && useradd --system --gid spring spring
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar
USER spring:spring
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
