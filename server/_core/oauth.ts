import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { supabaseServer } from "./lib/supabase";

const PROJECT_REF = "gxwtcdplfkjfidwyrunk";
const AUTH_COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // Supabase OAuth can send code as query param or in the URL hash
    // Check both query params and hash fragment
    let code = getQueryParam(req, "code");
    
    // If no code in query, check if it's in the hash (Supabase sometimes uses hash)
    if (!code && req.url.includes("#")) {
      const hashMatch = req.url.match(/[#&]code=([^&]+)/);
      if (hashMatch) {
        code = decodeURIComponent(hashMatch[1]);
      }
    }

    // Also check for error in hash
    if (!code) {
      const errorMatch = req.url.match(/[#&]error=([^&]+)/);
      if (errorMatch) {
        const error = decodeURIComponent(errorMatch[1]);
        console.error("[OAuth] Error in callback:", error);
        res.status(400).json({ error: `OAuth error: ${error}` });
        return;
      }
    }

    if (!code) {
      console.error("[OAuth] No code found in request:", {
        url: req.url,
        query: req.query,
        headers: req.headers,
      });
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      const { data, error } = await supabaseServer.auth.exchangeCodeForSession(code);
      if (error) throw error;

      const supabaseUser = data.user;
      if (!supabaseUser.id) {
        res.status(400).json({ error: "user id missing from Supabase response" });
        return;
      }

      const userInfo = {
        openId: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
        email: supabaseUser.email ?? null,
        loginMethod: supabaseUser.app_metadata?.provider || "oauth",
        lastSignedIn: new Date(),
      };

      await db.upsertUser(userInfo);

      // Set Supabase auth cookie
      const cookieOptions = getSessionCookieOptions(req);
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      };
      const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");
      const expiresMs = data.session.expires_in * 1000;
      res.cookie(AUTH_COOKIE_NAME, cookieValue, { 
        ...cookieOptions, 
        maxAge: expiresMs 
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
