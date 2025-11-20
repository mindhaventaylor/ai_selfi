export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseProjectRef: process.env.SUPABASE_PROJECT_REF ?? "",
};

if (!ENV.supabaseProjectRef) {
  throw new Error("SUPABASE_PROJECT_REF environment variable is required");
}
