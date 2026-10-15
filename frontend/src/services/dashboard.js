import { getPendingUsers } from './approvals';
import { getAuditLogs, getAuditStats, getHighRiskLogs } from './audit';
import { getCertificates, getRevokedCertificates } from './certificates';
import { getAllCsrs } from './csr';
import { getMyKeys } from './keys';
import { getSecurityAlerts, getSecurityStats } from './security';
import { getUsers } from './users';

const safeRequest = async (request, fallback) => {
  try {
    return await request();
  } catch (error) {
    console.warn('Dashboard data source failed:', error?.response?.status ?? error?.message ?? error);
    return fallback;
  }
};

const safeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const formatShortDay = (date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const buildTimeline = ({ auditLogs, threats, revokedCertificates, days = 7 }) => {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));

    return {
      key: date.toISOString().slice(0, 10),
      label: formatShortDay(date),
      audits: 0,
      threats: 0,
      revocations: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  auditLogs.forEach((log) => {
    const date = safeDate(log.timestamp);
    if (!date) {
      return;
    }

    const bucket = bucketMap.get(date.toISOString().slice(0, 10));
    if (bucket) {
      bucket.audits += 1;
    }
  });

  threats.forEach((threat) => {
    const date = safeDate(threat.createdAt ?? threat.timestamp ?? threat.detectedAt ?? threat.updatedAt);
    if (!date) {
      return;
    }

    const bucket = bucketMap.get(date.toISOString().slice(0, 10));
    if (bucket) {
      bucket.threats += 1;
    }
  });

  revokedCertificates.forEach((certificate) => {
    const date = safeDate(certificate.revocationDate ?? certificate.updatedAt ?? certificate.createdAt);
    if (!date) {
      return;
    }

    const bucket = bucketMap.get(date.toISOString().slice(0, 10));
    if (bucket) {
      bucket.revocations += 1;
    }
  });

  return buckets;
};

const buildCertificateDistribution = (certificates, revokedCertificates) => {
  const active = certificates.filter((certificate) => !certificate.revoked).length;
  const expiring = certificates.filter((certificate) => Number(certificate.daysRemaining) <= 30).length;
  const revoked = revokedCertificates.length;

  return [
    { name: 'Active', value: active },
    { name: 'Expiring', value: expiring },
    { name: 'Revoked', value: revoked },
  ].filter((item) => item.value > 0);
};

const buildRoleDistribution = (users) => {
  const grouped = users.reduce((accumulator, user) => {
    const role = user.role || 'UNKNOWN';
    accumulator[role] = (accumulator[role] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([role, total]) => ({
    role,
    total,
  }));
};

const getRecentItems = ({ highRiskLogs, threats, revokedCertificates }) => {
  const feed = [
    ...highRiskLogs.map((log) => ({
      id: `audit-${log.id ?? log.correlationId ?? log.timestamp}`,
      category: 'Audit',
      severity: (log.severity || log.status || 'HIGH').toUpperCase(),
      title: log.action || 'Audit event',
      meta: [log.username && `@${log.username}`, log.ip].filter(Boolean).join(' - ') || 'Security event',
      timestamp: log.timestamp,
    })),
    ...threats.map((threat) => ({
      id: `threat-${threat.id ?? threat.ip ?? threat.reason}`,
      category: 'Threat',
      severity: (threat.severity || 'MEDIUM').toUpperCase(),
      title: threat.reason || 'Threat detected',
      meta: [threat.ip, threat.country, threat.attempts ? `${threat.attempts} attempts` : null].filter(Boolean).join(' - '),
      timestamp: threat.createdAt ?? threat.timestamp ?? threat.detectedAt ?? threat.updatedAt,
    })),
    ...revokedCertificates.map((certificate) => ({
      id: `revoked-${certificate.id ?? certificate.serialNumber ?? certificate.revocationDate}`,
      category: 'Revocation',
      severity: 'REVOKED',
      title: certificate.commonName || certificate.certificateAlias || 'Certificate revoked',
      meta: certificate.reason || certificate.serialNumber || 'Revocation event',
      timestamp: certificate.revocationDate ?? certificate.updatedAt ?? certificate.createdAt,
    })),
  ];

  return feed
    .filter((item) => safeDate(item.timestamp))
    .sort((left, right) => safeDate(right.timestamp) - safeDate(left.timestamp))
    .slice(0, 8);
};

export const getDashboardSnapshot = async () => {
  const [
    certificates,
    revokedCertificates,
    auditStats,
    auditLogResponse,
    highRiskLogs,
    securityAlerts,
    securityStats,
    users,
    pendingUsers,
    csrs,
    keys,
  ] = await Promise.all([
    safeRequest(getCertificates, []),
    safeRequest(getRevokedCertificates, []),
    safeRequest(getAuditStats, {}),
    safeRequest(() => getAuditLogs({ page: 0, size: 200 }), { content: [] }),
    safeRequest(getHighRiskLogs, []),
    safeRequest(getSecurityAlerts, []),
    safeRequest(getSecurityStats, {}),
    safeRequest(getUsers, []),
    safeRequest(getPendingUsers, []),
    safeRequest(getAllCsrs, []),
    safeRequest(getMyKeys, []),
  ]);

  const auditLogs = Array.isArray(auditLogResponse?.content) ? auditLogResponse.content : [];
  const activeCertificates = certificates.filter((certificate) => !certificate.revoked).length;
  const expiringCertificates = certificates.filter((certificate) => Number(certificate.daysRemaining) <= 30).length;
  const activeUsers = users.filter((user) => user.enabled).length;
  const pendingCsrs = csrs.filter((csr) => (csr.status || '').toUpperCase() === 'PENDING').length;

  return {
    metrics: {
      totalCertificates: certificates.length,
      activeCertificates,
      revokedCertificates: revokedCertificates.length,
      expiringCertificates,
      totalAuditEvents: auditStats?.totalEvents ?? auditLogs.length,
      failedAuditEvents: auditStats?.failedActions ?? auditLogs.filter((log) => log.status === 'FAILED').length,
      revocationsToday: auditStats?.revocationsToday ?? 0,
      crlGenerated: auditStats?.crlGenerated ?? 0,
      totalThreats: securityStats?.total ?? securityAlerts.length,
      criticalThreats: securityStats?.critical ?? securityAlerts.filter((threat) => threat.severity === 'CRITICAL').length,
      highThreats: securityStats?.high ?? securityAlerts.filter((threat) => threat.severity === 'HIGH').length,
      mediumThreats: securityStats?.medium ?? securityAlerts.filter((threat) => threat.severity === 'MEDIUM').length,
      totalUsers: users.length,
      activeUsers,
      pendingApprovals: pendingUsers.length,
      totalCsrs: csrs.length,
      pendingCsrs,
      totalKeys: keys.length,
    },
    charts: {
      activityTimeline: buildTimeline({
        auditLogs,
        threats: securityAlerts,
        revokedCertificates,
      }),
      certificateDistribution: buildCertificateDistribution(certificates, revokedCertificates),
      roleDistribution: buildRoleDistribution(users),
    },
    feed: getRecentItems({
      highRiskLogs,
      threats: securityAlerts,
      revokedCertificates,
    }),
    datasets: {
      certificates,
      revokedCertificates,
      auditLogs,
      highRiskLogs,
      securityAlerts,
      users,
      pendingUsers,
      csrs,
      keys,
    },
  };
};
