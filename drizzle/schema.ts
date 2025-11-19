import { decimal, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin"]);
const photoStatusEnum = pgEnum("photo_status", ["generating", "completed", "failed"]);
const modelStatusEnum = pgEnum("model_status", ["training", "ready", "failed"]);
const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Supabase user ID (id) returned from Supabase auth. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const creditPacks = pgTable("credit_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  credits: integer("credits").notNull(),
  stripePriceId: text("stripePriceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  packId: integer("packId").references(() => creditPacks.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  stripePaymentId: text("stripePaymentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  status: modelStatusEnum("status").default("training").notNull(),
  triggerWord: text("triggerWord"),
  trainingDataUrl: text("trainingDataUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  modelId: integer("modelId").references(() => models.id, { onDelete: "set null" }),
  url: text("url"),
  style: text("style"),
  prompt: text("prompt"),
  status: photoStatusEnum("status").default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CreditPack = typeof creditPacks.$inferSelect;
export type InsertCreditPack = typeof creditPacks.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;