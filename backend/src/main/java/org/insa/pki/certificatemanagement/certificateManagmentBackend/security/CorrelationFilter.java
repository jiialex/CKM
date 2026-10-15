package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class CorrelationFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "X-Correlation-Id";
    private static final int MAX_LENGTH = 64;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String correlationId = resolveCorrelationId(request);

        try {

            request.setAttribute("correlationId", correlationId);

            MDC.put("correlationId", correlationId);


            response.setHeader(HEADER_NAME, correlationId);

            filterChain.doFilter(request, response);

        } finally {
            MDC.clear();
        }
    }


    private String resolveCorrelationId(HttpServletRequest request) {

        String header = request.getHeader(HEADER_NAME);

        if (header != null) {
            header = header.trim();

            if (!header.isEmpty()) {
                return sanitize(header);
            }
        }

        return generateId();
    }


    private String generateId() {
        return UUID.randomUUID().toString();
    }

    private String sanitize(String id) {

        if (id.length() > MAX_LENGTH) {
            return id.substring(0, MAX_LENGTH);
        }

        return id.replaceAll("[^a-zA-Z0-9\\-]", "");
    }
}