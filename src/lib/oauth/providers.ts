import { type CalendarProvider } from "@/types";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface ExternalEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  description?: string;
  location?: string;
}

export interface OAuthProvider {
  generateAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse>;
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  revokeToken(token: string): Promise<void>;
  getUserEmail(accessToken: string): Promise<string>;
  fetchEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<ExternalEvent[]>;
}

export class GoogleOAuthProvider implements OAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = "https:
  private readonly tokenUrl = "https:
  private readonly revokeUrl = "https:
  private readonly apiBaseUrl = "https:

  constructor() {
    this.clientId = import.meta.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || "";
    if (!this.clientId || !this.clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
    }
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https:
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: refreshToken,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async revokeToken(token: string): Promise<void> {
    const response = await fetch(this.revokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to revoke Google token: ${response.statusText}`);
    }
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch("https:
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user email: ${response.statusText}`);
    }

    const data = await response.json();
    return data.email;
  }

  async fetchEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<ExternalEvent[]> {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });

    const response = await fetch(`${this.apiBaseUrl}/calendars/primary/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.items || []).map(
      (item: {
        id: string;
        summary: string;
        start: { dateTime: string; date: string };
        end: { dateTime: string; date: string };
        description: string;
        location: string;
      }) => ({
        id: item.id,
        title: item.summary || "No Title",
        start_time: item.start.dateTime || item.start.date,
        end_time: item.end.dateTime || item.end.date,
        is_all_day: !item.start.dateTime,
        description: item.description,
        location: item.location,
      })
    );
  }
}

export class MicrosoftOAuthProvider implements OAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;
  private readonly baseUrl: string;
  private readonly tokenUrl: string;
  private readonly apiBaseUrl = "https:

  constructor() {
    this.clientId = import.meta.env.MICROSOFT_CLIENT_ID || "";
    this.clientSecret = import.meta.env.MICROSOFT_CLIENT_SECRET || "";
    this.tenantId = import.meta.env.MICROSOFT_TENANT_ID || "common";
    if (!this.clientId || !this.clientSecret) {
      throw new Error("MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET must be set");
    }
    this.baseUrl = `https:
    this.tokenUrl = `https:
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "Calendars.Read offline_access",
      state,
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        scope: "Calendars.Read offline_access",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async revokeToken(token: string): Promise<void> {
    const revokeUrl = `https:
    try {
      await fetch(revokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token,
        }),
      });
    } catch (error) {
      console.error(`Failed to revoke Microsoft token: ${error}`);
    }
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user email: ${response.statusText}`);
    }

    const data = await response.json();
    return data.mail || data.userPrincipalName;
  }

  async fetchEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<ExternalEvent[]> {
    const params = new URLSearchParams({
      $filter: `start/dateTime ge '${timeMin.toISOString()}' and end/dateTime le '${timeMax.toISOString()}'`,
      $orderby: "start/dateTime",
      $top: "2500",
    });

    const response = await fetch(`${this.apiBaseUrl}/me/calendar/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.value || []).map(
      (item: {
        id: string;
        subject: string;
        start: { dateTime: string };
        end: { dateTime: string };
        isAllDay: boolean;
        body?: { content: string };
        location?: { displayName: string };
      }) => ({
        id: item.id,
        title: item.subject || "No Title",
        start_time: item.start.dateTime,
        end_time: item.end.dateTime,
        is_all_day: item.isAllDay || false,
        description: item.body?.content,
        location: item.location?.displayName,
      })
    );
  }
}

export function createOAuthProvider(provider: CalendarProvider): OAuthProvider {
  switch (provider) {
    case "google":
      return new GoogleOAuthProvider();
    case "microsoft":
      return new MicrosoftOAuthProvider();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
