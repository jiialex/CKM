package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.TokenBlacklistRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.SecurityThreatService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistRepository blacklistRepo;
    private final SecurityThreatService threatService;

    public JwtFilter(JwtUtil jwtUtil,
                     TokenBlacklistRepository blacklistRepo,
                     SecurityThreatService threatService) {
        this.jwtUtil = jwtUtil;
        this.blacklistRepo = blacklistRepo;
        this.threatService = threatService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String ip = extractClientIp(request);
        String path = request.getRequestURI();
        String correlationId = (String) request.getAttribute("correlationId");

        // 1. Skip public endpoints
        if (isPublicEndpoint(path)) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Blocked IP check
        if (threatService.isBlocked(ip)) {
            sendForbidden(response, "IP blocked due to suspicious activity");
            return;
        }

        // 3. Authorization header check
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            threatService.analyze(buildContext(request, "MISSING_TOKEN", correlationId));
            sendUnauthorized(response, "Missing token");
            return;
        }

        String token = header.substring(7);

        try {
            // =========================
            // 4. SINGLE SAFE PARSE POINT
            // =========================
            var claims = jwtUtil.extractClaims(token);

            // 5. Extract JTI FIRST (safe now)
            String tokenId = claims.getId();

            // 6. Blacklist check
            if (blacklistRepo.findByToken(tokenId).isPresent()) {
                threatService.analyze(buildContext(request, "BLACKLISTED_TOKEN", correlationId));
                sendUnauthorized(response, "Token revoked");
                return;
            }

            // 7. Extract user info
            String username = claims.getSubject();
            String role = claims.get("role", String.class);

            if (role == null) {
                sendUnauthorized(response, "Invalid token role");
                return;
            }

            // 8. Build authentication object
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            auth.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // 9. Set security context
            SecurityContextHolder.getContext().setAuthentication(auth);

            // 10. Continue filter chain
            chain.doFilter(request, response);

        } catch (Exception e) {

            // Never crash the server due to bad token
            threatService.analyze(buildContext(request, "AUTH_ERROR", correlationId));

            sendUnauthorized(response, "Invalid or expired token");
        }
    }

    // =========================
    // PUBLIC ENDPOINTS
    // =========================
    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/auth/")
                || path.startsWith("/swagger")
                || path.startsWith("/v3/api-docs");
    }

    // =========================
    // IP EXTRACTION
    // =========================
    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // =========================
    // AUDIT CONTEXT
    // =========================
    private AuditContext buildContext(HttpServletRequest request,
                                      String action,
                                      String correlationId) {

        AuditContext ctx = new AuditContext();
        ctx.setUser("UNKNOWN");
        ctx.setAction(action);
        ctx.setIp(extractClientIp(request));
        ctx.setEndpoint(request.getRequestURI());
        ctx.setStatus(AuditStatus.FAILED);
        ctx.setCorrelationId(correlationId);

        return ctx;
    }

    // =========================
    // 401 RESPONSE
    // =========================
    private void sendUnauthorized(HttpServletResponse response,
                                  String message) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        response.getWriter().write("""
        {
          "error": "UNAUTHORIZED",
          "message": "%s"
        }
        """.formatted(message));
    }

    // =========================
    // 403 RESPONSE
    // =========================
    private void sendForbidden(HttpServletResponse response,
                               String message) throws IOException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");

        response.getWriter().write("""
        {
          "error": "FORBIDDEN",
          "message": "%s"
        }
        """.formatted(message));
    }
}