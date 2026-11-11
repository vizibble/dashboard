import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  device,
  deviceTemplate,
  metricDefinition,
  templateMetric,
  templateVersion,
} from "@/db/schema";

/**
 * Templates are versioned internally: a template's parameters live on its newest
 * `template_versions` row. Every change writes a new version and moves the template's
 * devices onto it, so devices always run the current configuration while older
 * configurations stay on record. Versions are never exposed through the API.
 */

export type ParameterValues = {
  metricDefinitionId: string | null;
  key: string;
  label: string;
  dataType: string;
  unit: string | null;
  symbol: string | null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const publicTemplateColumns = {
  id: deviceTemplate.id,
  organizationId: deviceTemplate.organizationId,
  name: deviceTemplate.name,
  description: deviceTemplate.description,
};

const parameterColumns = {
  id: templateMetric.id,
  metricDefinitionId: templateMetric.metricDefinitionId,
  key: templateMetric.key,
  label: templateMetric.label,
  dataType: templateMetric.dataType,
  unit: templateMetric.unit,
  symbol: templateMetric.symbol,
};

const currentVersionId = sql`(
  select tv.id from ${templateVersion} tv
  where tv.template_id = ${deviceTemplate.id}
  order by tv.version desc limit 1
)`;

export function listTemplatesQuery(organisationId: string) {
  return db
    .select({
      ...publicTemplateColumns,
      parameterCount: sql<number>`(
        select count(*)::int from ${templateMetric} tm
        where tm.template_version_id = ${currentVersionId}
      )`,
      deviceCount: sql<number>`(
        select count(*)::int from ${device} d
        join ${templateVersion} tv on tv.id = d.template_version_id
        where tv.template_id = ${deviceTemplate.id} and d.deleted_at is null
      )`,
    })
    .from(deviceTemplate)
    .where(
      and(
        eq(deviceTemplate.organizationId, organisationId),
        isNull(deviceTemplate.deletedAt),
      ),
    )
    .orderBy(deviceTemplate.name);
}

export async function findTemplateQuery(id: string, organisationId: string) {
  const [row] = await db
    .select(publicTemplateColumns)
    .from(deviceTemplate)
    .where(
      and(
        eq(deviceTemplate.id, id),
        eq(deviceTemplate.organizationId, organisationId),
        isNull(deviceTemplate.deletedAt),
      ),
    )
    .limit(1);
  return row;
}

/** Newest (current) configuration of a live template in this organisation. */
export async function findCurrentVersionQuery(
  templateId: string,
  organisationId: string,
  tx: Tx | typeof db = db,
) {
  const [row] = await tx
    .select({ id: templateVersion.id, version: templateVersion.version })
    .from(templateVersion)
    .innerJoin(
      deviceTemplate,
      eq(templateVersion.templateId, deviceTemplate.id),
    )
    .where(
      and(
        eq(templateVersion.templateId, templateId),
        eq(deviceTemplate.organizationId, organisationId),
        isNull(deviceTemplate.deletedAt),
      ),
    )
    .orderBy(desc(templateVersion.version))
    .limit(1);
  return row;
}

export function listParametersQuery(templateVersionId: string) {
  return db
    .select(parameterColumns)
    .from(templateMetric)
    .where(eq(templateMetric.templateVersionId, templateVersionId))
    .orderBy(asc(templateMetric.label));
}

/** Every key this template has ever defined, with its data type — used to protect history. */
export function listParameterHistoryQuery(
  templateId: string,
  tx: Tx | typeof db = db,
) {
  return tx
    .selectDistinct({
      key: templateMetric.key,
      dataType: templateMetric.dataType,
    })
    .from(templateMetric)
    .innerJoin(
      templateVersion,
      eq(templateMetric.templateVersionId, templateVersion.id),
    )
    .where(eq(templateVersion.templateId, templateId));
}

export async function countActiveDevicesQuery(templateId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(device)
    .innerJoin(
      templateVersion,
      eq(device.templateVersionId, templateVersion.id),
    )
    .where(
      and(eq(templateVersion.templateId, templateId), isNull(device.deletedAt)),
    );
  return row?.count ?? 0;
}

async function insertVersionWithParameters(
  tx: Tx,
  organisationId: string,
  templateId: string,
  version: number,
  parameters: ParameterValues[],
) {
  const versionId = crypto.randomUUID();
  await tx.insert(templateVersion).values({
    id: versionId,
    organizationId: organisationId,
    templateId,
    version,
  });
  if (parameters.length > 0) {
    await tx.insert(templateMetric).values(
      parameters.map((parameter) => ({
        ...parameter,
        id: crypto.randomUUID(),
        templateVersionId: versionId,
      })),
    );
  }
  return versionId;
}

export function createTemplateQuery(
  values: { organizationId: string; name: string; description: string | null },
  parameters: ParameterValues[],
) {
  return db.transaction(async (tx) => {
    const id = crypto.randomUUID();
    const [created] = await tx
      .insert(deviceTemplate)
      .values({ id, ...values })
      .returning(publicTemplateColumns);
    await insertVersionWithParameters(
      tx,
      values.organizationId,
      id,
      1,
      parameters,
    );
    return created!;
  });
}

function sameParameters(a: ParameterValues[], b: ParameterValues[]) {
  const signature = (list: ParameterValues[]) =>
    JSON.stringify(
      [...list]
        .sort((x, y) => x.key.localeCompare(y.key))
        .map((p) => [
          p.key,
          p.label,
          p.dataType,
          p.unit,
          p.symbol,
          p.metricDefinitionId,
        ]),
    );
  return signature(a) === signature(b);
}

/**
 * Replaces a template's parameters. Writes a new internal version and moves every
 * device of the template onto it in one transaction. A no-op when nothing changed.
 * Callers must validate history compatibility first (see listParameterHistoryQuery).
 */
export function replaceParametersQuery(
  templateId: string,
  organisationId: string,
  parameters: ParameterValues[],
) {
  return db.transaction(async (tx) => {
    // Serialise concurrent edits of the same template.
    await tx
      .select({ id: deviceTemplate.id })
      .from(deviceTemplate)
      .where(eq(deviceTemplate.id, templateId))
      .for("update");

    const current = await findCurrentVersionQuery(
      templateId,
      organisationId,
      tx,
    );
    if (!current) return null;

    const existing = await tx
      .select(parameterColumns)
      .from(templateMetric)
      .where(eq(templateMetric.templateVersionId, current.id));
    if (sameParameters(existing, parameters)) return { changed: false };

    const versionId = await insertVersionWithParameters(
      tx,
      organisationId,
      templateId,
      current.version + 1,
      parameters,
    );
    const versionIds = tx
      .select({ id: templateVersion.id })
      .from(templateVersion)
      .where(eq(templateVersion.templateId, templateId));
    await tx
      .update(device)
      .set({ templateVersionId: versionId })
      .where(
        and(
          inArray(device.templateVersionId, versionIds),
          isNull(device.deletedAt),
        ),
      );
    return { changed: true };
  });
}

export async function updateTemplateQuery(
  id: string,
  organisationId: string,
  values: Partial<
    Pick<typeof deviceTemplate.$inferInsert, "name" | "description">
  >,
) {
  const [row] = await db
    .update(deviceTemplate)
    .set(values)
    .where(
      and(
        eq(deviceTemplate.id, id),
        eq(deviceTemplate.organizationId, organisationId),
        isNull(deviceTemplate.deletedAt),
      ),
    )
    .returning(publicTemplateColumns);
  return row;
}

/** Soft delete: configuration history must outlive the template for past telemetry and deleted devices. */
export async function removeTemplateQuery(id: string, organisationId: string) {
  const [row] = await db
    .update(deviceTemplate)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(deviceTemplate.id, id),
        eq(deviceTemplate.organizationId, organisationId),
        isNull(deviceTemplate.deletedAt),
      ),
    )
    .returning({ id: deviceTemplate.id });
  return row;
}

/** Parameters a device must report, for telemetry ingestion. */
export function listMetricsQuery(templateVersionId: string) {
  return db
    .select()
    .from(templateMetric)
    .where(eq(templateMetric.templateVersionId, templateVersionId));
}

// --- Parameter catalogue -------------------------------------------------------

const definitionColumns = {
  id: metricDefinition.id,
  key: metricDefinition.key,
  label: metricDefinition.label,
  unit: metricDefinition.unit,
  symbol: metricDefinition.symbol,
  dataType: metricDefinition.dataType,
  category: metricDefinition.category,
  isBuiltIn: sql<boolean>`${metricDefinition.organizationId} is null`,
};

const visibleTo = (organisationId: string) =>
  or(
    isNull(metricDefinition.organizationId),
    eq(metricDefinition.organizationId, organisationId),
  );

/** Built-in definitions plus the organisation's own. Org entries win on key clashes. */
export async function listMetricDefinitionsQuery(organisationId: string) {
  const rows = await db
    .select(definitionColumns)
    .from(metricDefinition)
    .where(visibleTo(organisationId))
    .orderBy(asc(metricDefinition.category), asc(metricDefinition.label));
  const byKey = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const existing = byKey.get(row.key);
    if (!existing || (existing.isBuiltIn && !row.isBuiltIn))
      byKey.set(row.key, row);
  }
  return [...byKey.values()];
}

export function findMetricDefinitionsQuery(
  ids: string[],
  organisationId: string,
) {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select(definitionColumns)
    .from(metricDefinition)
    .where(and(inArray(metricDefinition.id, ids), visibleTo(organisationId)));
}

export async function findMetricDefinitionByKeyQuery(
  key: string,
  organisationId: string,
) {
  const [row] = await db
    .select(definitionColumns)
    .from(metricDefinition)
    .where(and(eq(metricDefinition.key, key), visibleTo(organisationId)))
    .limit(1);
  return row;
}

export async function insertMetricDefinitionQuery(
  values: Omit<typeof metricDefinition.$inferInsert, "id" | "createdAt">,
) {
  const [row] = await db
    .insert(metricDefinition)
    .values({ ...values, id: crypto.randomUUID() })
    .returning(definitionColumns);
  return row;
}
