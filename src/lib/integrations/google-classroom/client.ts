// src/lib/integrations/google-classroom/client.ts
// Google Classroom integration — OAuth, token storage, and core API wrapper.
//
// Required Google Cloud setup:
//   1. Enable Google Classroom API
//   2. OAuth consent screen with scopes:
//      - classroom.courses.readonly
//      - classroom.rosters.readonly
//      - classroom.coursework.students
//      - classroom.coursework.me
//      - classroom.profile.emails
//   3. OAuth credentials with redirect: /api/integrations/google-classroom/callback

import { google, classroom_v1 } from "googleapis";
import { db } from "@/lib/db";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/integrations/google-classroom/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.coursework.me",
  "https://www.googleapis.com/auth/classroom.profile.emails",
];

// ─────────────────────────────────────────────
// OAuth client
// ─────────────────────────────────────────────

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const client = makeOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  email: string;
}> {
  const client = makeOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google did not return both access and refresh tokens");
  }

  client.setCredentials(tokens);
  const userInfo = await google.oauth2({ version: "v2", auth: client }).userinfo.get();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    email: userInfo.data.email ?? "",
  };
}

// ─────────────────────────────────────────────
// Auth from stored tokens
// ─────────────────────────────────────────────

export async function getAuthorizedClient(userId: string): Promise<any> {
  const integration = await db.googleClassroomIntegration.findUnique({
    where: { userId },
  });
  if (!integration) throw new Error("Google Classroom not connected");

  const client = makeOAuth2Client();
  client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiryDate.getTime(),
  });

  // Auto-refresh
  client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await db.googleClassroomIntegration.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
        },
      });
    }
  });

  return client;
}

export function getClassroomApi(auth: any): classroom_v1.Classroom {
  return google.classroom({ version: "v1", auth });
}
