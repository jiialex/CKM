package org.insa.pki.certificatemanagement.certificateManagmentBackend.config;

import jakarta.annotation.PostConstruct;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.security.CorrelationFilter;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.security.JwtFilter;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.security.RateLimitFilter;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.security.Security;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    private final JwtFilter jwtFilter;
    private final CorrelationFilter correlationFilter;
    private final RateLimitFilter rateLimitFilter;

    public WebSecurityConfig(JwtFilter jwtFilter,
                             CorrelationFilter correlationFilter,
                             RateLimitFilter rateLimitFilter) {
        this.jwtFilter = jwtFilter;
        this.correlationFilter = correlationFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @PostConstruct
    public void init() {
        Security.addProvider(new BouncyCastleProvider());
        System.out.println("✅ Bouncy Castle Provider Added");
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // === Specific endpoints first (most important) ===

                        // Key Management - Any authenticated user
                        .requestMatchers("/api/keys/manage/**").authenticated()

                        // CSR Management - According to your @PreAuthorize
                        .requestMatchers(HttpMethod.GET, "/api/csr/**").hasAnyRole("USER", "AUDITOR", "CA_OPERATOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/csr/**").hasAnyRole("USER", "CA_OPERATOR", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/csr/**").hasAnyRole("USER", "AUDITOR", "CA_OPERATOR")

                        // Audit endpoints
                        .requestMatchers("/api/audit/**").hasAnyRole("ADMIN", "AUDITOR")

                        // FIXED: these two lines were missing the "/api" prefix, which meant
                        // they never matched a real incoming request (all controllers here are
                        // mapped under /api/...). That caused every one of these requests to
                        // silently fall through to the generic ".anyRequest().authenticated()"
                        // rule at the bottom — i.e. ANY authenticated user of ANY role could
                        // call /api/hsm/my-keys and /api/crl/my-revoked, bypassing the intended
                        // ROOT / CA_OPERATOR / INTERMEDIATE restriction entirely.
                        .requestMatchers("/api/certificates/my-certificates", "/api/csr/my").authenticated()
                        // FIXED (2nd pass): /api/hsm/my-keys is scoped to the caller's OWN
                        // keys (HsmServiceImpl.getMyKeys() calls findByCreatedBy(username)),
                        // so it's already safe for any authenticated user to view their own
                        // key list — a USER generating their own key pair for a CSR is the
                        // correct PKI model (the CA never holds subscriber private keys).
                        // The role restriction was blocking USER from ever seeing keys they
                        // themselves generated. /api/crl/my-revoked stays role-restricted
                        // since revocation status of CA-level certs is more sensitive.
                        .requestMatchers("/api/hsm/my-keys").authenticated()
                        .requestMatchers("/api/crl/my-revoked").hasAnyRole("ROOT", "CA_OPERATOR", "INTERMEDIATE")

                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/ca/**").hasAnyRole("ROOT", "CA_OPERATOR")
                        // General rules for other API endpoints (after specific ones)
                        .requestMatchers(HttpMethod.POST, "/api/**")
                        .access(new WebExpressionAuthorizationManager(
                                "isAuthenticated() and !hasRole('AUDITOR')"
                        ))
                        .requestMatchers(HttpMethod.PUT, "/api/**")
                        .access(new WebExpressionAuthorizationManager(
                                "isAuthenticated() and !hasRole('AUDITOR')"
                        ))
                        .requestMatchers(HttpMethod.PATCH, "/api/**")
                        .access(new WebExpressionAuthorizationManager(
                                "isAuthenticated() and !hasRole('AUDITOR')"
                        ))
                        .requestMatchers(HttpMethod.DELETE, "/api/**")
                        .access(new WebExpressionAuthorizationManager(
                                "isAuthenticated() and (hasRole('ADMIN') or hasRole('SUPER_ADMIN'))"
                        ))

                        .anyRequest().authenticated()
                )

                .addFilterBefore(correlationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
