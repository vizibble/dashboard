import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  dashboard,
  dashboardWidget,
  dashboardWidgetSource,
  dashboardWidgetThreshold,
} from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DashboardRow = typeof dashboard.$inferSelect;
export type WidgetValues = Omit<
  typeof dashboardWidget.$inferInsert,
  "id" | "organizationId" | "dashboardId" | "createdAt" | "updatedAt"
>;
export type SourceValues = {
  deviceId: string | null;
  locationId: string | null;
  includeChildLocations: boolean;
};
export type ThresholdValues = {
  value: string;
  color: string;
  label: string | null;
};

/** Dashboards a member may see: shared ones plus their own private ones. */
const visibleTo = (userId: string) =>
  or(eq(dashboard.visibility, "organisation"), eq(dashboard.createdBy, userId));

export function listDashboardsQuery(
  organisationId: string,
  userId: string,
  filters: { scope?: string; locationId?: string; deviceId?: string },
) {
  const conditions = [
    eq(dashboard.organizationId, organisationId),
    visibleTo(userId),
  ];
  if (filters.scope) conditions.push(eq(dashboard.scope, filters.scope));
  if (filters.locationId) {
    conditions.push(eq(dashboard.locationId, filters.locationId));
  }
  if (filters.deviceId)
    conditions.push(eq(dashboard.deviceId, filters.deviceId));
  return db
    .select()
    .from(dashboard)
    .where(and(...conditions))
    .orderBy(sql`${dashboard.isDefault} desc`, asc(dashboard.name));
}

export async function findDashboardQuery(
  id: string,
  organisationId: string,
  userId: string,
) {
  const [row] = await db
    .select()
    .from(dashboard)
    .where(
      and(
        eq(dashboard.id, id),
        eq(dashboard.organizationId, organisationId),
        visibleTo(userId),
      ),
    )
    .limit(1);
  return row;
}

/** Only one default per scope target: clear the others before setting this one. */
async function clearOtherDefaults(tx: Tx, row: DashboardRow) {
  await tx
    .update(dashboard)
    .set({ isDefault: false })
    .where(
      and(
        eq(dashboard.organizationId, row.organizationId),
        eq(dashboard.scope, row.scope),
        sql`coalesce(${dashboard.locationId}, ${dashboard.deviceId}, '') = ${row.locationId ?? row.deviceId ?? ""}`,
        ne(dashboard.id, row.id),
        eq(dashboard.isDefault, true),
      ),
    );
}

export function insertDashboardQuery(values: typeof dashboard.$inferInsert) {
  return db.transaction(async (tx) => {
    if (values.isDefault) {
      await clearOtherDefaults(tx, values as DashboardRow);
    }
    const [row] = await tx.insert(dashboard).values(values).returning();
    return row!;
  });
}

export function updateDashboardQuery(
  current: DashboardRow,
  values: Partial<typeof dashboard.$inferInsert>,
) {
  return db.transaction(async (tx) => {
    if (values.isDefault) await clearOtherDefaults(tx, current);
    const [row] = await tx
      .update(dashboard)
      .set(values)
      .where(
        and(
          eq(dashboard.id, current.id),
          eq(dashboard.organizationId, current.organizationId),
        ),
      )
      .returning();
    return row;
  });
}

export async function removeDashboardQuery(id: string, organisationId: string) {
  const [row] = await db
    .delete(dashboard)
    .where(
      and(eq(dashboard.id, id), eq(dashboard.organizationId, organisationId)),
    )
    .returning({ id: dashboard.id });
  return row;
}

// --- Widgets -------------------------------------------------------------------

/** Widgets with their sources and thresholds in three queries, not one per widget. */
export async function listWidgetsQuery(
  dashboardId: string,
  organisationId: string,
) {
  const widgets = await db
    .select()
    .from(dashboardWidget)
    .where(
      and(
        eq(dashboardWidget.dashboardId, dashboardId),
        eq(dashboardWidget.organizationId, organisationId),
      ),
    )
    .orderBy(asc(dashboardWidget.sortOrder), asc(dashboardWidget.createdAt));
  if (widgets.length === 0) return [];

  const ids = widgets.map((widget) => widget.id);
  const [sources, thresholds] = await Promise.all([
    db
      .select()
      .from(dashboardWidgetSource)
      .where(inArray(dashboardWidgetSource.widgetId, ids)),
    db
      .select()
      .from(dashboardWidgetThreshold)
      .where(inArray(dashboardWidgetThreshold.widgetId, ids))
      .orderBy(asc(dashboardWidgetThreshold.value)),
  ]);

  return widgets.map((widget) => ({
    ...widget,
    sources: sources.filter((source) => source.widgetId === widget.id),
    thresholds: thresholds.filter(
      (threshold) => threshold.widgetId === widget.id,
    ),
  }));
}

export async function findWidgetQuery(
  id: string,
  dashboardId: string,
  organisationId: string,
) {
  const [row] = await db
    .select({ id: dashboardWidget.id })
    .from(dashboardWidget)
    .where(
      and(
        eq(dashboardWidget.id, id),
        eq(dashboardWidget.dashboardId, dashboardId),
        eq(dashboardWidget.organizationId, organisationId),
      ),
    )
    .limit(1);
  return row;
}

async function replaceWidgetChildren(
  tx: Tx,
  organisationId: string,
  widgetId: string,
  sources: SourceValues[] | undefined,
  thresholds: ThresholdValues[] | undefined,
) {
  if (sources) {
    await tx
      .delete(dashboardWidgetSource)
      .where(eq(dashboardWidgetSource.widgetId, widgetId));
    if (sources.length > 0) {
      await tx.insert(dashboardWidgetSource).values(
        sources.map((source) => ({
          ...source,
          id: crypto.randomUUID(),
          organizationId: organisationId,
          widgetId,
        })),
      );
    }
  }
  if (thresholds) {
    await tx
      .delete(dashboardWidgetThreshold)
      .where(eq(dashboardWidgetThreshold.widgetId, widgetId));
    if (thresholds.length > 0) {
      await tx.insert(dashboardWidgetThreshold).values(
        thresholds.map((threshold) => ({
          ...threshold,
          id: crypto.randomUUID(),
          organizationId: organisationId,
          widgetId,
        })),
      );
    }
  }
}

export function insertWidgetQuery(
  organisationId: string,
  dashboardId: string,
  values: Omit<WidgetValues, "sortOrder">,
  sources: SourceValues[],
  thresholds: ThresholdValues[],
) {
  return db.transaction(async (tx) => {
    const id = crypto.randomUUID();
    const [next] = await tx
      .select({
        value: sql<number>`coalesce(max(${dashboardWidget.sortOrder}) + 1, 0)::int`,
      })
      .from(dashboardWidget)
      .where(eq(dashboardWidget.dashboardId, dashboardId));
    await tx.insert(dashboardWidget).values({
      ...values,
      id,
      organizationId: organisationId,
      dashboardId,
      sortOrder: next?.value ?? 0,
    });
    await replaceWidgetChildren(tx, organisationId, id, sources, thresholds);
    await touchDashboard(tx, dashboardId);
    return id;
  });
}

export function updateWidgetQuery(
  organisationId: string,
  dashboardId: string,
  widgetId: string,
  values: Partial<WidgetValues>,
  sources: SourceValues[] | undefined,
  thresholds: ThresholdValues[] | undefined,
) {
  return db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx
        .update(dashboardWidget)
        .set(values)
        .where(
          and(
            eq(dashboardWidget.id, widgetId),
            eq(dashboardWidget.organizationId, organisationId),
          ),
        );
    }
    await replaceWidgetChildren(
      tx,
      organisationId,
      widgetId,
      sources,
      thresholds,
    );
    await touchDashboard(tx, dashboardId);
  });
}

export function removeWidgetQuery(
  organisationId: string,
  dashboardId: string,
  widgetId: string,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .delete(dashboardWidget)
      .where(
        and(
          eq(dashboardWidget.id, widgetId),
          eq(dashboardWidget.dashboardId, dashboardId),
          eq(dashboardWidget.organizationId, organisationId),
        ),
      )
      .returning({ id: dashboardWidget.id });
    await touchDashboard(tx, dashboardId);
    return row;
  });
}

/** Saves positions and sizes for a whole dashboard at once. Unknown ids are ignored. */
export function updateLayoutQuery(
  organisationId: string,
  dashboardId: string,
  layout: { id: string; sortOrder: number; width: number; height: number }[],
) {
  return db.transaction(async (tx) => {
    for (const item of layout) {
      await tx
        .update(dashboardWidget)
        .set({
          sortOrder: item.sortOrder,
          width: item.width,
          height: item.height,
        })
        .where(
          and(
            eq(dashboardWidget.id, item.id),
            eq(dashboardWidget.dashboardId, dashboardId),
            eq(dashboardWidget.organizationId, organisationId),
          ),
        );
    }
    await touchDashboard(tx, dashboardId);
  });
}

async function touchDashboard(tx: Tx, dashboardId: string) {
  await tx
    .update(dashboard)
    .set({ updatedAt: new Date() })
    .where(eq(dashboard.id, dashboardId));
}
