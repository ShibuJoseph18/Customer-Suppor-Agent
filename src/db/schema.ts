import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  foreignKey,
} from "drizzle-orm/sqlite-core";

// ─── Users ─────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "admin", "support", "vendor"] }).notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  locale: text("locale", { enum: ["en", "es", "fr", "de", "ja"] }).notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  lastLogin: integer("last_login", { mode: "timestamp" }),
  emailValidated: integer("email_validated", { mode: "timestamp" }),
  phoneValidated: integer("phone_validated", { mode: "timestamp" }),
  bio: text("bio"),
  company: text("company"),
});

// ─── Social profiles ───────────────────────────────────────────────────────
export const socialProfiles = sqliteTable(
  "social_profiles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform", {
      enum: ["facebook", "twitter", "google", "github", "linkedin"],
    }).notNull(),
    platformUser: text("platform_user").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.platform] })]
);

// ─── Credentials ───────────────────────────────────────────────────────────
export const credentials = sqliteTable(
  "credentials",
  {
    providerId: text("provider_id", {
      enum: ["email_password", "google", "github", "facebook"],
    }).notNull(),
    providerKey: text("provider_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hasher: text("hasher", { enum: ["bcrypt", "scrypt", "argon2"] }).notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
  },
  (t) => [primaryKey({ columns: [t.providerId, t.providerKey] })]
);

// ─── Categories ────────────────────────────────────────────────────────────
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    parentCategoryId: text("parent_category_id"),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentCategoryId],
      foreignColumns: [t.id],
    }),
  ]
);

// ─── Products ─────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  picture: text("picture").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  discountType: text("discount_type", {
    enum: ["percentage", "fixed_amount", "none"],
  }).notNull().default("none"),
  discountValue: real("discount_value").notNull().default(0),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── Carts ─────────────────────────────────────────────────────────────────
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["active", "checkout", "purchased", "abandoned"],
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── Cart items ─────────────────────────────────────────────────────────────
export const cartItems = sqliteTable(
  "cart_items",
  {
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    price: real("price").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.productId] })]
);

// ─── Orders ───────────────────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Order lines ───────────────────────────────────────────────────────────
export const orderLines = sqliteTable("order_lines", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
});

// ─── Reviews ───────────────────────────────────────────────────────────────
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SocialProfile = typeof socialProfiles.$inferSelect;
export type NewSocialProfile = typeof socialProfiles.$inferInsert;
export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderLine = typeof orderLines.$inferSelect;
export type NewOrderLine = typeof orderLines.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
