-- Add avatarUrl column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" text;

