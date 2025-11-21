import { boolean, decimal, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin"]);
const photoStatusEnum = pgEnum("photo_status", ["generating", "completed", "failed"]);
const modelStatusEnum = pgEnum("model_status", ["training", "ready", "failed"]);
const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded"]);
const couponDiscountTypeEnum = pgEnum("coupon_discount_type", ["percentage", "fixed_amount", "credits"]);
const giftCardStatusEnum = pgEnum("gift_card_status", ["pending", "active", "redeemed", "expired"]);
const creditHistoryTypeEnum = pgEnum("credit_history_type", ["purchase", "gift_card", "coupon", "generation", "training", "refund", "admin_adjustment"]);

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
  avatarUrl: text("avatarUrl"),
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

// Define coupons first (before transactions references them)
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: couponDiscountTypeEnum("discountType").notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").default(0).notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Define transactions before giftCards to avoid circular reference
// Note: giftCardId reference will be added after giftCards is defined
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  packId: integer("packId").references(() => creditPacks.id),
  couponId: integer("couponId").references(() => coupons.id, { onDelete: "set null" }),
  giftCardId: integer("giftCardId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  creditsAwarded: integer("creditsAwarded").default(0),
  status: transactionStatusEnum("status").default("pending").notNull(),
  stripePaymentId: text("stripePaymentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Define giftCards after transactions (references transactions which is now defined)
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  purchasedByUserId: integer("purchasedByUserId").references(() => users.id, { onDelete: "set null" }),
  purchasedByEmail: text("purchasedByEmail"),
  recipientEmail: text("recipientEmail"),
  creditPackId: integer("creditPackId").references(() => creditPacks.id, { onDelete: "set null" }),
  credits: integer("credits").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: giftCardStatusEnum("status").default("pending").notNull(),
  redeemedByUserId: integer("redeemedByUserId").references(() => users.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemedAt"),
  expiresAt: timestamp("expiresAt"),
  transactionId: integer("transactionId").references(() => transactions.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  status: modelStatusEnum("status").default("training").notNull(),
  gender: text("gender"), // "hombre" | "mujer"
  previewImageUrl: text("previewImageUrl"),
  trainingCreditsUsed: integer("trainingCreditsUsed").default(0),
  imagesCount: integer("imagesCount"), // 1-5
  triggerWord: text("triggerWord"),
  trainingDataUrl: text("trainingDataUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  modelId: integer("modelId").references(() => models.id, { onDelete: "set null" }),
  generationBatchId: integer("generationBatchId").references(() => photoGenerationBatches.id, { onDelete: "set null" }),
  url: text("url"),
  style: text("style"),
  prompt: text("prompt"),
  status: photoStatusEnum("status").default("generating").notNull(),
  creditsUsed: integer("creditsUsed").default(0),
  aspectRatio: text("aspectRatio"), // "1:1" | "9:16" | "16:9"
  glasses: text("glasses"), // "yes" | "no"
  hairColor: text("hairColor"), // "default" | "black" | "brown" | "blonde" | "red"
  hairStyle: text("hairStyle"), // "no-preference" | "short" | "medium" | "long" | "curly"
  backgrounds: jsonb("backgrounds").default([]),
  styles: jsonb("styles").default([]),
  referenceImageId: integer("referenceImageId"),
  downloadCount: integer("downloadCount").default(0),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// New tables
export const modelTrainingImages = pgTable("model_training_images", {
  id: serial("id").primaryKey(),
  modelId: integer("modelId").references(() => models.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageOrder: integer("imageOrder").notNull(), // 1-5
  fileSize: integer("fileSize"),
  fileName: text("fileName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const photoGenerationBatches = pgTable("photo_generation_batches", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  modelId: integer("modelId").references(() => models.id, { onDelete: "set null" }).notNull(),
  totalImagesGenerated: integer("totalImagesGenerated").notNull(),
  creditsUsed: integer("creditsUsed").notNull(),
  aspectRatio: text("aspectRatio").notNull(), // "1:1" | "9:16" | "16:9"
  glasses: text("glasses").notNull(), // "yes" | "no"
  hairColor: text("hairColor"), // "default" | "black" | "brown" | "blonde" | "red"
  hairStyle: text("hairStyle"), // "no-preference" | "short" | "medium" | "long" | "curly"
  backgrounds: jsonb("backgrounds").default([]),
  styles: jsonb("styles").default([]),
  status: text("status").default("generating").notNull(), // "generating" | "completed" | "failed"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const photoGenerationQueue = pgTable("photo_generation_queue", {
  id: serial("id").primaryKey(),
  batchId: integer("batchId").references(() => photoGenerationBatches.id, { onDelete: "cascade" }).notNull(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  modelId: integer("modelId").references(() => models.id, { onDelete: "set null" }).notNull(),
  exampleImageId: integer("exampleImageId").notNull(),
  exampleImageUrl: text("exampleImageUrl").notNull(),
  exampleImagePrompt: text("exampleImagePrompt").notNull(),
  trainingImageUrls: jsonb("trainingImageUrls").default([]).notNull(),
  basePrompt: text("basePrompt").notNull(),
  aspectRatio: text("aspectRatio").notNull(), // "1:1" | "9:16" | "16:9"
  numImagesPerExample: integer("numImagesPerExample").default(4).notNull(),
  glasses: text("glasses").notNull(),
  hairColor: text("hairColor"),
  hairStyle: text("hairStyle"),
  backgrounds: jsonb("backgrounds").default([]),
  styles: jsonb("styles").default([]),
  status: text("status").default("pending").notNull(), // "pending" | "processing" | "completed" | "failed" | "rate_limited"
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("maxAttempts").default(5).notNull(),
  retryAt: timestamp("retryAt"),
  lockedBy: text("lockedBy"),
  lockedAt: timestamp("lockedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  completedAt: timestamp("completedAt"),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  couponId: integer("couponId").references(() => coupons.id, { onDelete: "cascade" }).notNull(),
  creditsAwarded: integer("creditsAwarded"),
  discountApplied: decimal("discountApplied", { precision: 10, scale: 2 }),
  transactionId: integer("transactionId").references(() => transactions.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
});

export const creditHistory = pgTable("credit_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // Positive = added, Negative = deducted
  type: creditHistoryTypeEnum("type").notNull(),
  description: text("description"),
  relatedTransactionId: integer("relatedTransactionId").references(() => transactions.id, { onDelete: "set null" }),
  relatedPhotoId: integer("relatedPhotoId").references(() => photos.id, { onDelete: "set null" }),
  relatedModelId: integer("relatedModelId").references(() => models.id, { onDelete: "set null" }),
  relatedGiftCardId: integer("relatedGiftCardId").references(() => giftCards.id, { onDelete: "set null" }),
  relatedCouponId: integer("relatedCouponId").references(() => coupons.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
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
export type ModelTrainingImage = typeof modelTrainingImages.$inferSelect;
export type InsertModelTrainingImage = typeof modelTrainingImages.$inferInsert;
export type PhotoGenerationBatch = typeof photoGenerationBatches.$inferSelect;
export type InsertPhotoGenerationBatch = typeof photoGenerationBatches.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type InsertCouponRedemption = typeof couponRedemptions.$inferInsert;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;
export type CreditHistory = typeof creditHistory.$inferSelect;
export type InsertCreditHistory = typeof creditHistory.$inferInsert;