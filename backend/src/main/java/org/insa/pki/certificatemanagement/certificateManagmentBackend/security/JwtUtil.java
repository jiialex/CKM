package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CaType;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${pki.master-secret:ChangeThisSecret123!}")
    private String SECRET;

    private final long ACCESS_EXPIRATION = 1000 * 60 * 60;           // 1 hour
    private final long REFRESH_EXPIRATION = 7L * 24 * 60 * 60 * 1000; // 7 days
    private final long RESET_EXPIRATION = 30 * 60 * 1000;             // 30 minutes

    private Key getSignKey() {
        // Ensure the key is at least 256 bits (32 characters)
        String keyForSigning = SECRET;
        if (keyForSigning.getBytes().length < 32) {
            keyForSigning = SECRET + "ThisIsASecureFallbackSecretKey1234567890ExtraPaddingToMakeItLongEnough!";
        }
        return Keys.hmacShaKeyFor(keyForSigning.getBytes());
    }

    // =========================================================
    // ACCESS TOKEN
    // =========================================================
    public String generateToken(String username, Role role, CaType caType) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role.name())
                .claim("caType", caType != null ? caType.name() : null)
                .setId(UUID.randomUUID().toString())
                .setIssuer("PKI-System")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_EXPIRATION))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================================================
    // REFRESH TOKEN
    // =========================================================
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setId(UUID.randomUUID().toString())
                .setIssuer("PKI-System-Refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================================================
    // PASSWORD RESET TOKEN
    // =========================================================
    public String generatePasswordResetToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .claim("type", "password_reset")
                .setId(UUID.randomUUID().toString())
                .setIssuer("PKI-System")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + RESET_EXPIRATION))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================================================
    // EXTRACT CLAIMS
    // =========================================================
    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public String extractCaType(String token) {
        return extractClaims(token).get("caType", String.class);
    }

    public String extractJti(String token) {
        return extractClaims(token).getId();
    }

    public boolean isValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}