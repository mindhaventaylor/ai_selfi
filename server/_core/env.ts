// Lazy getter for supabaseProjectRef to allow environment variables to be set after module load
function getSupabaseProjectRef(): string {
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!ref) {
    throw new Error("SUPABASE_PROJECT_REF environment variable is required");
  }
  return ref;
}

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  get supabaseProjectRef() {
    return getSupabaseProjectRef();
  },
};
