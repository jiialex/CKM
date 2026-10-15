export const hasRole = (user, roles = []) => {
  if (!user || !user.role) return false;

  return roles.includes(user.role);
};

export const isAdmin = (user) =>
  user?.role === "ROLE_ADMIN";

export const isAuditor = (user) =>
  user?.role === "ROLE_AUDITOR";

export const isRootOperator = (user) =>
  user?.role === "ROLE_OPERATOR_ROOT";

export const isIntermediateOperator = (user) =>
  user?.role === "ROLE_OPERATOR_INTERMEDIATE";

export const isEndUser = (user) =>
  user?.role === "ROLE_ENDUSER";