import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema.js";
import { ENV } from './_core/env.js';
import { supabaseServer } from './_core/lib/supabase.js';

let _db: ReturnType<typeof drizzle> | null = null;
let _useRestApi = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // If we've already determined REST API should be used, skip connection attempt
  if (_useRestApi) {
    return null;
  }
  
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL!, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      // Test the connection with a timeout
      await Promise.race([
        client`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection timeout")), 5000)
        )
      ]);
      _db = drizzle(client);
      _useRestApi = false;
      console.log("[Database] Direct connection established");
    } catch (error) {
      const dbUrl = process.env.DATABASE_URL || '';
      // Mask password in URL for logging
      const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
      console.warn(`[Database] Direct connection failed (${maskedUrl}), using REST API fallback:`, error instanceof Error ? error.message : error);
      _db = null;
      _useRestApi = true;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  
  // Use REST API fallback if direct connection failed
  if (!db || _useRestApi) {
    try {
      const values: Record<string, unknown> = {
        openId: user.openId,
      };

      if (user.name !== undefined) values.name = user.name;
      if (user.email !== undefined) values.email = user.email;
      if (user.avatarUrl !== undefined) values.avatarUrl = user.avatarUrl;
      if (user.loginMethod !== undefined) values.loginMethod = user.loginMethod;
      if (user.credits !== undefined) values.credits = user.credits;
      if (user.role !== undefined) {
        values.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = 'admin';
      }
      
      values.lastSignedIn = user.lastSignedIn ? new Date(user.lastSignedIn).toISOString() : new Date().toISOString();

      // Use Supabase REST API to upsert (upsert handles both insert and update)
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabaseServer
        .from('users')
        .select('id')
        .eq('openId', user.openId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on not found

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine, other errors are real problems
        throw checkError;
      }

      if (existingUser) {
        // Update existing user
        const { error } = await supabaseServer
          .from('users')
          .update(values)
          .eq('openId', user.openId);
        
        if (error) throw error;
      } else {
        // Insert new user
        const { error } = await supabaseServer
          .from('users')
          .insert(values);
        
        if (error) {
          // If insert fails due to duplicate, try update instead (race condition)
          if (error.code === '23505') {
            const { error: updateError } = await supabaseServer
              .from('users')
              .update(values)
              .eq('openId', user.openId);
            if (updateError) throw updateError;
          } else {
            throw error;
          }
        }
      }
      
      return;
    } catch (error) {
      console.error("[Database] Failed to upsert user via REST API:", error);
      throw error;
    }
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "avatarUrl", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.credits !== undefined) {
      values.credits = user.credits;
      updateSet.credits = user.credits;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  
  // Use REST API fallback if direct connection failed
  if (!db || _useRestApi) {
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('openId', openId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error("[Database] Failed to get user via REST API:", error);
        return undefined;
      }
      
      return data || undefined;
    } catch (error) {
      console.error("[Database] Failed to get user via REST API:", error);
      return undefined;
    }
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
