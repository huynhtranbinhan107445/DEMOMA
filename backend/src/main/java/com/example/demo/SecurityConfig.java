package com.example.demo;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import java.util.Optional;
@Configuration @EnableWebSecurity
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean UserDetailsService users(StudentRepository students,LecturerRepository lecturers,PasswordEncoder encoder,
  @Value("${app.admin.username:admin}") String adminUser,
  @Value("${app.admin.password:}") String adminPassword){
  return username->{
   if(username.equalsIgnoreCase(adminUser)){
    if(adminPassword.isBlank())throw new UsernameNotFoundException("Admin chưa cấu hình");
    return new User(adminUser,encoder.encode(adminPassword),List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
   }
   Optional<Lecturer> lecturer=lecturers.findByEmailIgnoreCase(username);
   if(lecturer.isPresent()){
    String hash=lecturer.get().getPassword();
    if(hash==null||!hash.startsWith("$2"))throw new UsernameNotFoundException("Giảng viên chưa có mật khẩu đăng nhập");
    return new User(lecturer.get().getEmail(),hash,List.of(new SimpleGrantedAuthority("ROLE_LECTURER")));
   }
   Student s=students.findByEmail(username).orElseThrow(()->new UsernameNotFoundException("Không tìm thấy tài khoản"));
   String password=s.getPassword();
   if(password==null||!password.startsWith("$2"))throw new UsernameNotFoundException("Tài khoản chưa được chuyển mật khẩu BCrypt");
   return new User(s.getEmail(),password,List.of(new SimpleGrantedAuthority("ROLE_STUDENT")));
  };
 }
 @Bean SecurityFilterChain filterChain(HttpSecurity http)throws Exception{
  return http.csrf(csrf->csrf.disable())
   .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(auth->auth
    .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
    .requestMatchers(HttpMethod.GET,"/api/public/school","/api/forum/posts").permitAll()
    .requestMatchers(HttpMethod.PUT,"/api/public/school").hasRole("ADMIN")
    .requestMatchers(HttpMethod.POST,"/api/forum/posts","/api/forum/posts/*/comments").hasAnyRole("ADMIN","STUDENT","LECTURER")
    .requestMatchers(HttpMethod.DELETE,"/api/forum/posts/*").hasRole("ADMIN")
    .requestMatchers("/api/auth/login","/api/auth/me").authenticated()
    .requestMatchers("/api/auth/change-password").authenticated()
    .requestMatchers(HttpMethod.GET,"/api/graduation-conditions","/api/graduation-conditions/**").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers("/api/graduation-conditions","/api/graduation-conditions/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/faculties","/api/academic-classes").hasAnyRole("ADMIN","STUDENT","LECTURER")
    .requestMatchers("/api/faculties","/api/faculties/**","/api/academic-classes","/api/academic-classes/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/students/**").hasRole("ADMIN")
    .requestMatchers("/api/students/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/credit-price").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers(HttpMethod.GET,"/api/lecturer-payments").hasAnyRole("ADMIN","LECTURER")
    .requestMatchers(HttpMethod.GET,"/api/lecturers/me").hasRole("LECTURER")
    .requestMatchers("/api/credit-price").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/tuition/**").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers(HttpMethod.GET,"/api/exams/**","/api/lecturers/**").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers("/api/tuition/**","/api/exams/**","/api/lecturers/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/profile/me").hasRole("STUDENT")
    .requestMatchers(HttpMethod.GET,"/api/grades").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers("/api/grades/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/enrollments").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers("/api/enrollments/**").hasAnyRole("ADMIN","STUDENT")
    .requestMatchers(HttpMethod.GET,"/api/courses/**","/api/schedules/**","/api/notifications/**").hasAnyRole("ADMIN","STUDENT","LECTURER")
    .requestMatchers(HttpMethod.GET,"/api/exams/**","/api/lecturers/**").hasAnyRole("ADMIN","STUDENT")
    // Admin va giang vien co quyen su dung lich giang, hoc phan va cong viec.
    // Controller tiep tuc gioi han giang vien chi thao tac du lieu cua minh.
    .requestMatchers("/api/teaching-tasks","/api/teaching-tasks/**").hasAnyRole("ADMIN","LECTURER")
    .requestMatchers("/api/courses","/api/courses/**","/api/schedules","/api/schedules/**").hasAnyRole("ADMIN","LECTURER")
    .requestMatchers("/api/**").hasRole("ADMIN")
    .anyRequest().permitAll())
   .httpBasic(Customizer.withDefaults()).build();
 }
}
