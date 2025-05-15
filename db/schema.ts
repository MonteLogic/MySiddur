import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('Users', {
  id: text('id').primaryKey(),
  clerkID: text('clerkID'),
  organizationID: text('organizationID'),
  userNiceName: text('userNiceName').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  dateHired: text('dateHired').notNull(),
  dateAddedToCB: text('dateAddedToCB').notNull(),
  img: text('img'),
});

export const routes = sqliteTable('Routes', {
  id: text('id').primaryKey(),
  organizationID: text('organizationID'),
  routeNiceName: text('routeNiceName').notNull(),
  routeIDFromPostOffice: text('routeIDFromPostOffice'),
  dateRouteAcquired: text('dateRouteAcquired').notNull(),
  dateAddedToCB: text('dateAddedToCB').notNull(),
  img: text('img'),
});

export const routeShiftInfo = sqliteTable('RouteShiftInfo', {
  // Should default to a ROWID.
  id: text('id').primaryKey(),
  organizationID: text('organizationID'),
  routeId: text('routeId')
    .notNull()
    .references(() => routes.id),
  shiftName: text('shiftName').notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  dateAddedToCB: text('dateAddedToCB').notNull(),
});

export const workTimeShift = sqliteTable('WorkTimeShift', {
  id: text('id').primaryKey(),
  organizationID: text('organizationID'),
  occupied: integer('occupied', { mode: 'boolean' }).notNull().default(false),
  userId: text('userId').notNull(),
  shiftWorked: text('shiftWorked')
    .notNull()
    .references(() => routeShiftInfo.id),
  dayScheduled: text('dayScheduled').notNull(),
  dateAddedToCB: text('dateAddedToCB').notNull(),
  routeId: text('routeId')
    .notNull()
    .references(() => routes.id),
  summary: text('summary').default('{}'),
});
