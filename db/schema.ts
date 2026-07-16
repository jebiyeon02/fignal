import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("verification_history_created_at_idx").on(table.createdAt)],
);
