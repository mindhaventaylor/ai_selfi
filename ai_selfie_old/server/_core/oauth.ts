import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Application } from "express";
import * as db from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { supabaseServer } from "./lib/supabase.js";
import { ENV } from "./env.js";

function getAuthCookieName(): string {
  return `sb-${ENV.supabaseProjectRef}-auth-token`;
}

function getQueryParam(req: any, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Application | any) {
  const expressApp = app as any;
  expressApp.get("/api/oauth/callback", async (req: any, res: any) => {
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
      const { data, error } = await (supabaseServer.auth as any).exchangeCodeForSession(code);
      if (error) throw error;

      const supabaseUser = data.user;
      if (!supabaseUser.id) {
        res.status(400).json({ error: "user id missing from Supabase response" });
        return;
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseServer
        .from('users')
        .select('id')
        .eq('openId', supabaseUser.id)
        .maybeSingle();

      const userInfo: any = {
        openId: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
        email: supabaseUser.email ?? null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        loginMethod: supabaseUser.app_metadata?.provider || "oauth",
        lastSignedIn: new Date(),
      };

      // Only give credits to new users
      if (!existingUser) {
        userInfo.credits = 100; // Give new users 100 credits for testing
      }

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
      res.cookie(getAuthCookieName(), cookieValue, { 
        ...cookieOptions, 
        maxAge: expiresMs 
      });

      // Use absolute URL for redirect to prevent localhost redirects
      // Get the origin from the request headers (Vercel sets these)
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      
      // Determine host - prioritize forwarded host, then request host, then environment-based fallback
      let host = req.headers['x-forwarded-host'] || req.headers.host;
      
      // If no host header (shouldn't happen, but fallback for safety)
      if (!host) {
        // In development, use localhost; in production, use production domain
        if (process.env.NODE_ENV === 'development') {
          host = `localhost:${process.env.PORT || '3000'}`;
        } else {
          host = 'www.aiselfie.org';
        }
      }
      
      const origin = `${protocol}://${host}`;
      
      // Redirect to dashboard for authenticated users (Home page will redirect if needed)
      res.redirect(302, `${origin}/dashboard`);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
