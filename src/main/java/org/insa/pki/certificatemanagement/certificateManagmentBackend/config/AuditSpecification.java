package org.insa.pki.certificatemanagement.certificateManagmentBackend.config;

import jakarta.persistence.criteria.Predicate;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AuditSpecification {

    public static Specification<AuditLog> filter(
            AuditFilterRequest req
    ) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (req.getUsername() != null && !req.getUsername().isBlank()) {

                predicates.add(
                        cb.like(
                                cb.lower(root.get("username")),
                                "%" + req.getUsername().toLowerCase() + "%"
                        )
                );
            }
            if (req.getSearch() != null && !req.getSearch().isBlank()) {

                String value =
                        "%" + req.getSearch().toLowerCase() + "%";

                predicates.add(

                        cb.or(

                                cb.like(
                                        cb.lower(root.get("username")),
                                        value
                                ),

                                cb.like(
                                        cb.lower(root.get("action")),
                                        value
                                ),

                                cb.like(
                                        cb.lower(root.get("target")),
                                        value
                                ),

                                cb.like(
                                        cb.lower(root.get("endpoint")),
                                        value
                                ),

                                cb.like(
                                        cb.lower(root.get("ip")),
                                        value
                                ),

                                cb.like(
                                        cb.lower(root.get("correlationId")),
                                        value
                                )
                        )
                );
            }
            if (req.getTarget() != null && !req.getTarget().isBlank()) {

                predicates.add(
                        cb.like(
                                cb.lower(root.get("target")),
                                "%" + req.getTarget().toLowerCase() + "%"
                        )
                );
            }

            if (req.getResource() != null && !req.getResource().isBlank()) {

                predicates.add(
                        cb.like(
                                cb.lower(root.get("target")),
                                req.getResource().toLowerCase() + ":%"
                        )
                );
            }

            if (req.getEndpoint() != null && !req.getEndpoint().isBlank()) {

                predicates.add(
                        cb.like(
                                cb.lower(root.get("endpoint")),
                                "%" + req.getEndpoint().toLowerCase() + "%"
                        )
                );
            }

            if (req.getAction() != null && !req.getAction().isBlank()) {

                predicates.add(
                        cb.equal(
                                root.get("action"),
                                req.getAction()
                        )
                );
            }

            if (req.getStatus() != null) {

                predicates.add(
                        cb.equal(
                                root.get("status"),
                                req.getStatus()
                        )
                );
            }

            if (req.getSeverity() != null) {

                predicates.add(
                        cb.equal(
                                root.get("severity"),
                                req.getSeverity()
                        )
                );
            }

            if (req.getEventType() != null) {

                predicates.add(
                        cb.equal(
                                root.get("eventType"),
                                req.getEventType()
                        )
                );
            }

            if (
                    req.getCorrelationId() != null
                            && !req.getCorrelationId().isBlank()
            ) {

                predicates.add(
                        cb.like(
                                root.get("correlationId"),
                                "%" + req.getCorrelationId() + "%"
                        )
                );
            }

            if (req.getIp() != null && !req.getIp().isBlank()) {

                predicates.add(
                        cb.like(
                                root.get("ip"),
                                "%" + req.getIp() + "%"
                        )
                );
            }

            if (req.getFrom() != null && req.getTo() != null) {

                predicates.add(
                        cb.between(
                                root.get("timestamp"),
                                req.getFrom(),
                                req.getTo()
                        )
                );
            } else if (req.getFrom() != null) {

                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("timestamp"),
                                req.getFrom()
                        )
                );
            } else if (req.getTo() != null) {

                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.get("timestamp"),
                                req.getTo()
                        )
                );
            }

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}
