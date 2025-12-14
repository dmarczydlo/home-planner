export function buildInvitationUrl(token: string): string {
  const frontendUrl = import.meta.env.FRONTEND_URL || "http://localhost:4321";
  return `${frontendUrl}/invitations/accept?token=${token}`;
}

