package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendNotificationEmail(String to, String subject, String messageBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("no-reply@yourdomain.com");

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>%s</h2>
                    <p>%s</p>
                    <p style="margin-top:25px; color:#666; font-size:0.9em;">
                        PKI Certificate Management System
                    </p>
                </div>
                """.formatted(escapeHtml(subject), escapeHtml(messageBody));

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send notification email.", e);
        }
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🔐 Password Recovery - Vault Access");
            helper.setFrom("no-reply@yourdomain.com"); // Optional but recommended

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You have requested to reset your password for the PKI Certificate Management System.</p>
                    <p>Click the button below to set a new password:</p>
                    <a href="%s" style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
                        Reset My Password
                    </a>
                    <p style="margin-top:25px; color:#666; font-size:0.9em;">
                        This link will expire in 30 minutes.<br>
                        If you did not request this, please ignore this email.
                    </p>
                </div>
                """.formatted(resetLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            System.out.println("✅ Password reset email sent to: " + to);

        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send password reset email. Please check email configuration.", e);
        }
    }
}
