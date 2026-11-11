import { z } from "zod";

import {
  idInput,
  metricKeyInput,
  organisationIdInput,
  resolveOrganisation,
} from "@/tools/helpers";
import { defineTool, ToolError, type ToolContext } from "@/tools/types";

/**
 * Template, settings reads and every change Vera can make. Each write:
 *  - is marked `access: "write"`, so WhatsApp asks the user YES/NO and MCP clients ask for approval,
 *  - describes the exact change in plain words before it runs,
 *  - calls one main-API endpoint that re-checks the user's role (and, for ChatGPT/Claude,
 *    the separate vizibble:write consent).
 * Deliberately not offered: members/roles, deleting organisations, device keys.
 */

const nameInput = z.string().trim().min(1).max(160);
const dataTypes = ["number", "integer", "string", "boolean"] as const;

const parameterInput = z
  .object({
    key: metricKeyInput,
    label: nameInput,
    data_type: z
      .enum(dataTypes)
      .describe(
        "number/integer for measurements; boolean for on/off; string for text states.",
      ),
    unit: z
      .string()
      .trim()
      .max(40)
      .optional()
      .describe("Unit name, e.g. Celsius."),
    symbol: z
      .string()
      .trim()
      .max(40)
      .optional()
      .describe("Unit symbol, e.g. °C."),
  })
  .strict();

const timeRangeInput = z.enum([
  "1h",
  "6h",
  "24h",
  "7d",
  "30d",
  "today",
  "yesterday",
  "this_week",
]);

async function nameOf(
  kind: "location" | "device" | "template" | "dashboard",
  ctx: ToolContext,
  organisationId: string,
  id: string,
) {
  try {
    if (kind === "location")
      return (await ctx.api.location(ctx.delegation, organisationId, id)).name;
    if (kind === "device")
      return (await ctx.api.device(ctx.delegation, organisationId, id)).name;
    if (kind === "template")
      return (await ctx.api.template(ctx.delegation, organisationId, id)).name;
    return (await ctx.api.dashboard(ctx.delegation, organisationId, id)).name;
  } catch {
    return `${kind} ${id.slice(0, 8)}`;
  }
}

// --- Reads that support changes ---------------------------------------------------------

const listTemplates = defineTool({
  name: "list_templates",
  title: "List device templates",
  description:
    "Lists device templates (the parameter sets devices record) with parameter and device counts. Use to find a template id before creating a device.",
  input: z.object({ organisation_id: organisationIdInput }).strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return {
      templates: await ctx.api.templates(ctx.delegation, organisationId),
    };
  },
});

const getTemplate = defineTool({
  name: "get_template",
  title: "Template details",
  description:
    "Returns a template's parameters (key, label, data type, unit) and how many devices use it.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      template_id: idInput("Template"),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return await ctx.api.template(
      ctx.delegation,
      organisationId,
      input.template_id,
    );
  },
});

const listMetricCatalogue = defineTool({
  name: "list_metric_catalogue",
  title: "Metric catalogue",
  description:
    "Lists the standard and organisation-specific metric definitions to reuse when building templates (keys, units, data types).",
  input: z
    .object({
      organisation_id: organisationIdInput,
      search: z.string().max(100).optional(),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const all = await ctx.api.metricDefinitions(ctx.delegation, organisationId);
    const term = input.search?.toLowerCase();
    const metrics = term
      ? all.filter((m) =>
          `${m.key} ${m.label} ${m.category ?? ""}`
            .toLowerCase()
            .includes(term),
        )
      : all;
    return { metrics: metrics.slice(0, 100) };
  },
});

const getSettings = defineTool({
  name: "get_organisation_settings",
  title: "Organisation settings",
  description:
    "Returns the organisation's timezone (used for 'today', 'yesterday' and time buckets).",
  input: z.object({ organisation_id: organisationIdInput }).strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const settings = await ctx.api.settings(ctx.delegation, organisationId);
    return { timezone: settings.timezone, can_edit: settings.can_edit };
  },
});

// --- Locations ----------------------------------------------------------------------------

const createLocation = defineTool({
  name: "create_location",
  title: "Create location",
  access: "write",
  description:
    "Creates a site, area or line. Set can_contain_locations=true for a site/area that will hold other locations; leave it false for a place devices are installed (devices can only be placed in those).",
  input: z
    .object({
      organisation_id: organisationIdInput,
      name: nameInput,
      parent_id: z
        .uuid()
        .optional()
        .describe("Parent location; omit for a top-level site."),
      can_contain_locations: z.boolean().default(false),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const parent = input.parent_id
      ? ` inside "${await nameOf("location", ctx, organisationId, input.parent_id)}"`
      : " at the top level";
    return `Create location "${input.name}"${parent}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const location = await ctx.api.createLocation(
      ctx.delegation,
      organisationId,
      {
        name: input.name,
        parent_id: input.parent_id ?? null,
        can_have_children: input.can_contain_locations,
      },
    );
    return { created: { id: location.id, name: location.name } };
  },
});

const renameLocation = defineTool({
  name: "rename_location",
  title: "Rename location",
  access: "write",
  description: "Renames a location.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      location_id: idInput("Location"),
      name: nameInput,
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Rename location "${await nameOf("location", ctx, organisationId, input.location_id)}" to "${input.name}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const location = await ctx.api.renameLocation(
      ctx.delegation,
      organisationId,
      input.location_id,
      input.name,
    );
    return { updated: { id: location.id, name: location.name } };
  },
});

const deleteLocation = defineTool({
  name: "delete_location",
  title: "Delete location",
  access: "write",
  description:
    "Deletes an empty location. Locations that still contain locations or devices can't be deleted.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      location_id: idInput("Location"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Delete location "${await nameOf("location", ctx, organisationId, input.location_id)}". This can't be undone.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    await ctx.api.deleteLocation(
      ctx.delegation,
      organisationId,
      input.location_id,
    );
    return { deleted: input.location_id };
  },
});

// --- Devices --------------------------------------------------------------------------------

const createDevice = defineTool({
  name: "create_device",
  title: "Register device",
  access: "write",
  description:
    "Registers a new device in a location using a template. The device's secret key is never shown here: the user copies it from the device page in Vizibble (Rotate key).",
  input: z
    .object({
      organisation_id: organisationIdInput,
      name: nameInput,
      template_id: idInput("Template"),
      location_id: idInput("Location"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const [template, location] = await Promise.all([
      nameOf("template", ctx, organisationId, input.template_id),
      nameOf("location", ctx, organisationId, input.location_id),
    ]);
    return `Register device "${input.name}" (template "${template}") in "${location}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const device = await ctx.api.createDevice(ctx.delegation, organisationId, {
      name: input.name,
      template_id: input.template_id,
      location_id: input.location_id,
    });
    return {
      created: {
        id: device.id,
        name: device.name,
        template: device.template_name,
      },
      next_step:
        "Open the device in Vizibble and use Rotate key to get its connection key.",
    };
  },
});

const updateDevice = defineTool({
  name: "update_device",
  title: "Update device",
  access: "write",
  description:
    "Renames a device, moves it to another location, or switches its template. Pass only what changes.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      device_id: idInput("Device"),
      name: nameInput.optional(),
      location_id: z.uuid().optional(),
      template_id: z.uuid().optional(),
    })
    .strict()
    .refine((v) => v.name || v.location_id || v.template_id, {
      message: "Say what to change: name, location_id or template_id.",
    }),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const changes: string[] = [];
    if (input.name) changes.push(`rename it to "${input.name}"`);
    if (input.location_id)
      changes.push(
        `move it to "${await nameOf("location", ctx, organisationId, input.location_id)}"`,
      );
    if (input.template_id)
      changes.push(
        `switch it to template "${await nameOf("template", ctx, organisationId, input.template_id)}"`,
      );
    return `Update device "${await nameOf("device", ctx, organisationId, input.device_id)}": ${changes.join(", ")}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const device = await ctx.api.updateDevice(
      ctx.delegation,
      organisationId,
      input.device_id,
      {
        name: input.name,
        location_id: input.location_id,
        template_id: input.template_id,
      },
    );
    return {
      updated: {
        id: device.id,
        name: device.name,
        template: device.template_name,
        location_id: device.location_id,
      },
    };
  },
});

const deleteDevice = defineTool({
  name: "delete_device",
  title: "Delete device",
  access: "write",
  description:
    "Deletes a device. Its key stops working immediately; its recorded telemetry is kept.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      device_id: idInput("Device"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Delete device "${await nameOf("device", ctx, organisationId, input.device_id)}". It will stop sending data.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    await ctx.api.deleteDevice(ctx.delegation, organisationId, input.device_id);
    return { deleted: input.device_id };
  },
});

// --- Templates ------------------------------------------------------------------------------

const createTemplate = defineTool({
  name: "create_template",
  title: "Create template",
  access: "write",
  description:
    "Creates a device template with its parameters. Reuse keys from list_metric_catalogue where possible.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      name: nameInput,
      description: z.string().trim().max(2000).optional(),
      parameters: z.array(parameterInput).min(1).max(50),
    })
    .strict(),
  async describe(input) {
    return `Create template "${input.name}" with ${input.parameters.length} parameter(s): ${input.parameters.map((p) => p.label).join(", ")}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const template = await ctx.api.createTemplate(
      ctx.delegation,
      organisationId,
      {
        name: input.name,
        description: input.description ?? null,
        parameters: input.parameters,
      },
    );
    return {
      created: {
        id: template.id,
        name: template.name,
        parameters: template.parameters.length,
      },
    };
  },
});

const updateTemplate = defineTool({
  name: "update_template",
  title: "Rename template",
  access: "write",
  description: "Changes a template's name or description.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      template_id: idInput("Template"),
      name: nameInput.optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .strict()
    .refine((v) => v.name || v.description !== undefined, {
      message: "Say what to change: name or description.",
    }),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const current = await nameOf(
      "template",
      ctx,
      organisationId,
      input.template_id,
    );
    return input.name
      ? `Rename template "${current}" to "${input.name}".`
      : `Update the description of template "${current}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const template = await ctx.api.updateTemplate(
      ctx.delegation,
      organisationId,
      input.template_id,
      {
        name: input.name,
        description: input.description,
      },
    );
    return { updated: { id: template.id, name: template.name } };
  },
});

const setTemplateParameters = defineTool({
  name: "set_template_parameters",
  title: "Set template parameters",
  access: "write",
  description:
    "Replaces a template's full parameter list (include existing parameters you want to keep; get them with get_template). Devices on the template switch to the new configuration; past readings keep their labels.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      template_id: idInput("Template"),
      parameters: z.array(parameterInput).max(50),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const current = await ctx.api.template(
      ctx.delegation,
      organisationId,
      input.template_id,
    );
    const before = new Set(current.parameters.map((p) => p.key));
    const after = new Set(input.parameters.map((p) => p.key));
    const added = [...after].filter((k) => !before.has(k));
    const removed = [...before].filter((k) => !after.has(k));
    const parts = [
      added.length ? `add ${added.join(", ")}` : "",
      removed.length ? `remove ${removed.join(", ")}` : "",
    ].filter(Boolean);
    return `Change parameters of template "${current.name}" (${current.device_count} device(s))${parts.length ? `: ${parts.join("; ")}` : ""}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const template = await ctx.api.replaceTemplateParameters(
      ctx.delegation,
      organisationId,
      input.template_id,
      input.parameters,
    );
    return {
      updated: {
        id: template.id,
        name: template.name,
        parameters: template.parameters.map((p) => p.key),
      },
    };
  },
});

const deleteTemplate = defineTool({
  name: "delete_template",
  title: "Delete template",
  access: "write",
  description: "Deletes a template that no device uses.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      template_id: idInput("Template"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Delete template "${await nameOf("template", ctx, organisationId, input.template_id)}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    await ctx.api.deleteTemplate(
      ctx.delegation,
      organisationId,
      input.template_id,
    );
    return { deleted: input.template_id };
  },
});

// --- Dashboards -----------------------------------------------------------------------------

const createDashboard = defineTool({
  name: "create_dashboard",
  title: "Create dashboard",
  access: "write",
  description:
    "Creates a dashboard for the whole organisation, one location, or one device. Shared with the organisation unless visibility is 'private'. Add charts with add_dashboard_widget.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      name: nameInput,
      description: z.string().trim().max(2000).optional(),
      scope: z.enum(["organisation", "location", "device"]),
      location_id: z.uuid().optional(),
      device_id: z.uuid().optional(),
      time_range: timeRangeInput.default("24h"),
      visibility: z.enum(["organisation", "private"]).default("organisation"),
    })
    .strict()
    .refine(
      (v) =>
        (v.scope === "location") === Boolean(v.location_id) &&
        (v.scope === "device") === Boolean(v.device_id),
      {
        message:
          "A location dashboard needs location_id; a device dashboard needs device_id; an organisation dashboard needs neither.",
      },
    ),
  async describe(input) {
    return `Create ${input.visibility === "private" ? "private" : "shared"} dashboard "${input.name}" (${input.scope}, ${input.time_range}).`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const dashboard = await ctx.api.createDashboard(
      ctx.delegation,
      organisationId,
      {
        name: input.name,
        description: input.description ?? null,
        scope: input.scope,
        location_id: input.location_id,
        device_id: input.device_id,
        time_range: input.time_range,
        visibility: input.visibility,
      },
    );
    return { created: { id: dashboard.id, name: dashboard.name } };
  },
});

const updateDashboard = defineTool({
  name: "update_dashboard",
  title: "Update dashboard",
  access: "write",
  description:
    "Renames a dashboard, changes its description, default time range, visibility, or makes it the default.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
      name: nameInput.optional(),
      description: z.string().trim().max(2000).optional(),
      time_range: timeRangeInput.optional(),
      visibility: z.enum(["organisation", "private"]).optional(),
      is_default: z.boolean().optional(),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const { organisation_id: _o, dashboard_id: _d, ...changes } = input;
    const summary = Object.entries(changes)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k.replace("_", " ")} → ${String(v)}`)
      .join(", ");
    if (!summary) throw new ToolError("invalid_input", "Nothing to change.");
    return `Update dashboard "${await nameOf("dashboard", ctx, organisationId, input.dashboard_id)}": ${summary}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const { organisation_id: _o, dashboard_id, ...changes } = input;
    if (Object.values(changes).every((v) => v === undefined))
      throw new ToolError("invalid_input", "Nothing to change.");
    const dashboard = await ctx.api.updateDashboard(
      ctx.delegation,
      organisationId,
      dashboard_id,
      changes,
    );
    return { updated: { id: dashboard.id, name: dashboard.name } };
  },
});

const deleteDashboard = defineTool({
  name: "delete_dashboard",
  title: "Delete dashboard",
  access: "write",
  description:
    "Deletes a dashboard and its widgets. Telemetry is not affected.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Delete dashboard "${await nameOf("dashboard", ctx, organisationId, input.dashboard_id)}" and all its widgets.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    await ctx.api.deleteDashboard(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
    );
    return { deleted: input.dashboard_id };
  },
});

const widgetFields = {
  title: nameInput,
  type: z
    .enum(["kpi", "line", "area", "bar", "gauge", "state", "table"])
    .describe(
      "kpi/gauge for one value, line/area/bar over time, state for on/off, table for latest values.",
    ),
  metric_key: metricKeyInput,
  aggregation: z.enum(["latest", "raw", "avg", "min", "max", "sum", "count"]),
  time_range: timeRangeInput
    .optional()
    .describe("Omit to follow the dashboard's range."),
  device_ids: z.array(z.uuid()).max(20).optional(),
  location_ids: z
    .array(z.uuid())
    .max(10)
    .optional()
    .describe(
      "Includes sub-locations. Omit both to follow the dashboard's scope.",
    ),
};

function widgetBody(input: {
  title: string;
  type: string;
  metric_key: string;
  aggregation: string;
  time_range?: string;
  device_ids?: string[];
  location_ids?: string[];
}) {
  return {
    title: input.title,
    type: input.type as "kpi",
    metric_key: input.metric_key,
    aggregation: input.aggregation as "latest",
    time_range: input.time_range ?? null,
    sources: [
      ...(input.device_ids ?? []).map((device_id) => ({ device_id })),
      ...(input.location_ids ?? []).map((location_id) => ({ location_id })),
    ],
  };
}

const addWidget = defineTool({
  name: "add_dashboard_widget",
  title: "Add dashboard widget",
  access: "write",
  description:
    "Adds a chart or value to a dashboard. The calculation must suit the chart and the metric's data type (the server checks).",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
      ...widgetFields,
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return `Add ${input.type} widget "${input.title}" (${input.aggregation} of ${input.metric_key}) to dashboard "${await nameOf("dashboard", ctx, organisationId, input.dashboard_id)}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const widget = await ctx.api.createWidget(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
      widgetBody(input),
    );
    return { created: widget };
  },
});

const replaceWidget = defineTool({
  name: "update_dashboard_widget",
  title: "Update dashboard widget",
  access: "write",
  description:
    "Replaces a widget's settings (pass the full set of fields, as for add_dashboard_widget). Widget ids are in get_dashboard_summary.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
      widget_id: idInput("Widget"),
      ...widgetFields,
    })
    .strict(),
  async describe(input) {
    return `Change widget "${input.title}" to a ${input.type} showing ${input.aggregation} of ${input.metric_key}.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const widget = await ctx.api.updateWidget(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
      input.widget_id,
      widgetBody(input),
    );
    return { updated: widget };
  },
});

const deleteWidget = defineTool({
  name: "delete_dashboard_widget",
  title: "Remove dashboard widget",
  access: "write",
  description: "Removes one widget from a dashboard.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
      widget_id: idInput("Widget"),
    })
    .strict(),
  async describe(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const dashboard = await ctx.api.dashboard(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
    );
    const widget = dashboard.widgets.find((w) => w.id === input.widget_id);
    return `Remove widget "${widget?.title ?? input.widget_id.slice(0, 8)}" from dashboard "${dashboard.name}".`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    await ctx.api.deleteWidget(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
      input.widget_id,
    );
    return { deleted: input.widget_id };
  },
});

// --- Settings -------------------------------------------------------------------------------

const setTimezone = defineTool({
  name: "set_organisation_timezone",
  title: "Set timezone",
  access: "write",
  description:
    "Changes the organisation's timezone (IANA name such as Asia/Kolkata). Affects 'today', 'yesterday' and daily buckets for everyone.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      timezone: z.string().trim().min(1).max(64),
    })
    .strict(),
  async describe(input) {
    return `Change the organisation timezone to ${input.timezone} for every member.`;
  },
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const settings = await ctx.api.updateTimezone(
      ctx.delegation,
      organisationId,
      input.timezone,
    );
    return { updated: { timezone: settings.timezone } };
  },
});

export const writeSupportReads = [
  listTemplates,
  getTemplate,
  listMetricCatalogue,
  getSettings,
];

export const writeTools = [
  createLocation,
  renameLocation,
  deleteLocation,
  createDevice,
  updateDevice,
  deleteDevice,
  createTemplate,
  updateTemplate,
  setTemplateParameters,
  deleteTemplate,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  addWidget,
  replaceWidget,
  deleteWidget,
  setTimezone,
];
