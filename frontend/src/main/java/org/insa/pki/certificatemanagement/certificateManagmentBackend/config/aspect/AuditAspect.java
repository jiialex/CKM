package org.insa.pki.certificatemanagement.certificateManagmentBackend.config.aspect;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.LoginRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;
import org.springframework.web.server.ResponseStatusException;

@Aspect
@Component
public class AuditAspect {

    private static final Logger log =
            LoggerFactory.getLogger(AuditAspect.class);

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp,
                        Auditable auditable) throws Throwable {

        long start = System.currentTimeMillis();

        AuditContext ctx = new AuditContext();

        HttpServletRequest request = getRequestSafely();

        try {

            String username = getUsername(pjp);

            if (request != null) {

                ctx.setIp(request.getRemoteAddr());

                ctx.setEndpoint(request.getRequestURI());

                ctx.setCorrelationId(
                        (String) request.getAttribute("correlationId")
                );
            }

            ctx.setUser(username);

            ctx.setAction(auditable.action());

            ctx.setResource(auditable.resource());

            ctx.setLevel(auditable.level());

            ctx.setTarget(buildTarget(pjp, auditable));

            ctx.setStatus(AuditStatus.SUCCESS);

            Object result = pjp.proceed();

            if (result instanceof ResponseEntity<?> response) {
                ctx.setHttpStatus(response.getStatusCode().value());
            } else {
                ctx.setHttpStatus(200);
            }

            return result;

        } catch (Throwable ex) {

            ctx.setStatus(AuditStatus.FAILED);

            ctx.setDetails(ex.getMessage());

            if (ex instanceof ResponseStatusException responseStatusException) {
                ctx.setHttpStatus(responseStatusException.getStatusCode().value());
            } else {
                ctx.setHttpStatus(500);
            }

            throw ex;

        } finally {

            long duration =
                    System.currentTimeMillis() - start;

            ctx.setExecutionTimeMs(duration);

            try {

                auditService.log(ctx);

            } catch (Exception e) {

                log.error("Audit logging failed", e);
            }
        }
    }

    // =========================================
    // FIXED USERNAME EXTRACTION
    // =========================================

    private String getUsername(ProceedingJoinPoint pjp) {

        Authentication auth =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        String username = "anonymous";

        if (auth != null) {
            username = auth.getName();
        }

        // =========================================
        // LOGIN FIX
        // =========================================

        if ("anonymousUser".equals(username)
                || "anonymous".equals(username)) {

            for (Object arg : pjp.getArgs()) {

                if (arg instanceof LoginRequest loginRequest) {

                    username = loginRequest.getUsername();

                    break;
                }
            }
        }

        return username;
    }

    private HttpServletRequest getRequestSafely() {

        RequestAttributes attrs =
                RequestContextHolder.getRequestAttributes();

        if (attrs instanceof ServletRequestAttributes servletAttrs) {

            return servletAttrs.getRequest();
        }

        return null;
    }

    private String buildTarget(JoinPoint jp, Auditable auditable) {

        String methodTarget =
                jp.getSignature().getDeclaringType().getSimpleName()
                        + "."
                        + jp.getSignature().getName();

        if (auditable.resource() == null || auditable.resource().isBlank()) {
            return methodTarget;
        }

        return auditable.resource() + ":" + methodTarget;
    }
}
