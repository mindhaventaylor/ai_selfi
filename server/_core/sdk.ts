import { AXIOS_TIMEOUT_MS } from "../../shared/const.js";
import { ForbiddenError } from "../../shared/_core/errors.js";
import type { User } from "../../drizzle/schema.js";
import * as db from "../db.js";
import { ENV } from "./env.js";
import { supabaseServer } from "./lib/supabase.js";
import { parse as parseCookieHeader } from "cookie";

const PROJECT_REF = "gxwtcdplfkjfidwyrunk";
const AUTH_COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: any): Promise<User> {
    // Parse Supabase auth cookie
    const cookieHeader = (req as any).headers?.cookie || (req.headers as any)?.cookie;
    const cookies = this.parseCookies(cookieHeader);
    const authCookie = cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie) {
      throw ForbiddenError("Missing auth cookie");
    }

    try {
      const sessionStr = Buffer.from(authCookie, "base64").toString();
      const session = JSON.parse(sessionStr);

      if (!session.access_token) {
        throw new Error("Invalid session format");
      }

      const { data: { user }, error } = await (supabaseServer.auth as any).getUser(session.access_token);
      if (error || !user) {
        throw new Error("Invalid access token");
      }

      const openId = user.id;
      const signedInAt = new Date();
      let dbUser = await db.getUserByOpenId(openId);

      // If user not in DB, sync from Supabase
      if (!dbUser) {
        try {
          await db.upsertUser({
            openId: user.id,
            name: user.user_metadata?.name || user.user_metadata?.full_name || null,
            email: user.email ?? null,
            loginMethod: user.app_metadata?.provider || null,
            lastSignedIn: signedInAt,
          });
          dbUser = await db.getUserByOpenId(openId);
        } catch (error) {
          console.error("[Auth] Failed to sync user from Supabase:", error);
          throw ForbiddenError("Failed to sync user info");
        }
      }

      if (!dbUser) {
        throw ForbiddenError("User not found");
      }

      // Update last signed in
      await db.upsertUser({
        openId: dbUser.openId,
        lastSignedIn: signedInAt,
      });

      return dbUser;
    } catch (error) {
      console.warn("[Auth] Authentication failed", String(error));
      throw ForbiddenError("Authentication failed");
    }
  }
}

export const sdk = new SDKServer();
