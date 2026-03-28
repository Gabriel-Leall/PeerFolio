export function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1_000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `há ${diffYears} ano${diffYears > 1 ? "s" : ""}`;
  if (diffMonths > 0) return `há ${diffMonths} mês${diffMonths > 1 ? "es" : ""}`;
  if (diffDays > 0) return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;

  return "hoje";
}

export function getInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "?";
}
