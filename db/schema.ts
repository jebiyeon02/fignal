import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const verificationHistory = sqliteTable(
  "verification_history",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    productNumber: text("product_number").notNull(),
    productMaker: text("product_maker").notNull(),
    productImage: text("product_image").notNull().default(""),
    productOfficialUrl: text("product_official_url").notNull().default(""),
    verdict: text("verdict").notNull(),
    summary: text("summary").notNull(),
    evidenceCompleteness: integer("evidence_completeness").notNull(),
    photoCount: integer("photo_count").notNull(),
    riskSignalCount: integer("risk_signal_count").notNull(),
    matchedCaseCount: integer("matched_case_count").notNull(),
    analysisJson: text("analysis_json").notNull(),
    promptVersion: text("prompt_version").notNull(),
    communityPublishTokenHash: text("community_publish_token_hash").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("verification_history_created_at_idx").on(table.createdAt)],
);

export const communityPosts = sqliteTable(
  "community_posts",
  {
    id: text("id").primaryKey(),
    verificationId: text("verification_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("collecting"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("community_posts_verification_idx").on(table.verificationId),
    index("community_posts_created_at_idx").on(table.createdAt),
  ],
);

export const communityComments = sqliteTable(
  "community_comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    nickname: text("nickname").notNull(),
    body: text("body").notNull(),
    passwordHash: text("password_hash"),
    passwordSalt: text("password_salt"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("community_comments_post_created_at_idx").on(table.postId, table.createdAt)],
);

export const verificationReportImages = sqliteTable(
  "verification_report_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    verificationId: text("verification_id").notNull(),
    evidenceKey: text("evidence_key").notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("verification_report_images_verification_evidence_idx").on(table.verificationId, table.evidenceKey),
    index("verification_report_images_object_key_idx").on(table.objectKey),
  ],
);

export const siteFeedback = sqliteTable(
  "site_feedback",
  {
    id: text("id").primaryKey(),
    message: text("message").notNull(),
    pagePath: text("page_path").notNull().default("/"),
    pageContext: text("page_context").notNull().default("search"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("site_feedback_created_at_idx").on(table.createdAt)],
);

export const siteEvents = sqliteTable(
  "site_events",
  {
    id: text("id").primaryKey(),
    sessionHash: text("session_hash").notNull(),
    eventName: text("event_name").notNull(),
    pagePath: text("page_path").notNull().default("/"),
    pageContext: text("page_context").notNull().default("other"),
    productId: text("product_id"),
    verificationId: text("verification_id"),
    propertiesJson: text("properties_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("site_events_created_at_idx").on(table.createdAt),
    index("site_events_event_created_at_idx").on(table.eventName, table.createdAt),
    index("site_events_session_created_at_idx").on(table.sessionHash, table.createdAt),
    index("site_events_product_created_at_idx").on(table.productId, table.createdAt),
  ],
);
