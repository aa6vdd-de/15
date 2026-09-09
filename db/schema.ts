import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(), date: text('date').notNull(), product: text('product').notNull(), category: text('category').notNull(),
  qty: integer('qty').notNull(), revenue: integer('revenue').notNull(), cost: integer('cost').notNull(),
  notes: text('notes').notNull().default(''), version: integer('version').notNull().default(1), createdAt: text('created_at').notNull(),
}, table => [index('idx_sales_date').on(table.date)]);
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(), date: text('date').notNull(), title: text('title').notNull(), category: text('category').notNull(),
  type: text('type').notNull(), amount: integer('amount').notNull(), notes: text('notes').notNull().default(''),
  version: integer('version').notNull().default(1), createdAt: text('created_at').notNull(),
}, table => [index('idx_expenses_date').on(table.date)]);
