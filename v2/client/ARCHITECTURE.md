# Client Architecture Guide

This document defines how the client application is organised and the conventions to follow when modifying or extending it.

**These instructions apply to all code changes**, including new features, bug fixes, refactoring, and UI improvements.

AI coding agents must read and follow this guide before making changes to the client.

## 1. Core Principles

Follow these principles when working in the codebase:

- **Respect existing architecture.** Extend established patterns instead of introducing alternative approaches without a concrete reason.
- **Keep responsibilities separate.** API communication, server-state management, business logic, UI workflows, and presentation belong in their respective layers.
- **Prefer feature-local code.** Keep code close to the feature that owns it. Promote it to shared only when multiple features genuinely need it.
- **Keep dependencies directional.** Lower-level modules must not depend on higher-level UI or feature-specific modules.
- **Avoid unnecessary abstractions.** Do not introduce generic factories, wrappers, helper layers, or additional files without a clear benefit.
- **Preserve existing behaviour.** Refactoring must not silently change API contracts, permissions, query behaviour, navigation, or user interactions.
- **Follow the project's existing conventions.** Naming, imports, styling, component APIs, and error handling should remain consistent.

When uncertain, inspect the Devices feature first. It is the reference implementation for the client architecture.

Do not copy its implementation blindly. Verify that the pattern is appropriate for the feature being modified.

## 2. Feature Layout

Each feature lives under `src/app/pages/<feature>/`.

Keep screen-specific code inside its screen directory. Place code shared by multiple screens of the same feature inside that feature's `shared/` directory.

Example:

```text
src/app/pages/devices/
├── list/
│   ├── page.tsx
│   └── components/
│
├── detail/
│   ├── page.tsx
│   └── components/
│
└── shared/
    ├── api.ts
    ├── queries.ts
    ├── types.ts
    ├── hooks/
    │   ├── use-device-queries.ts
    │   ├── use-device-mutations.ts
    │   └── use-device-actions.ts
    ├── lib/
    │   └── device-changes.ts
    └── components/
```

### Placement rules

| Code                                            | Location                     |
| ----------------------------------------------- | ---------------------------- |
| Page and screen-specific components             | Feature screen directory     |
| Components shared across screens of one feature | Feature `shared/components/` |
| API request functions                           | Feature `shared/api.ts`      |
| TanStack Query keys and query options           | Feature `shared/queries.ts`  |
| Read and write query hooks                      | Feature `shared/hooks/`      |
| UI workflows and feature state                  | Feature `shared/hooks/`      |
| Pure business logic                             | Feature `shared/lib/`        |
| Feature-specific types                          | Feature `shared/types.ts`    |
| Code genuinely shared across features           | `src/app/shared/`            |

Do not move code into `src/app/shared/` simply because it might be reusable someday.

`src/app/shared/` contains cross-feature infrastructure, shared UI primitives, layouts, and utilities such as `api-request` and `getErrorMessage`.

**Dependency restriction:** Shared code must never import from feature-specific directories.

## 3. Dependency Architecture

Dependencies must follow a one-way direction.

```text
Page / Components
       │
       ▼
Feature Hooks
       │
       ▼
Query Definitions
       │
       ▼
API Functions
       │
       ▼
Shared API Infrastructure
```

Pure business logic in `lib/` can be consumed by the appropriate layers without depending on them.

### Layer responsibilities

#### `api.ts` - API communication

Contains framework-independent functions that communicate with backend endpoints.

Rules:

- Define a separate function for each API operation.
- Use the shared `api` client from `api-request`.
- Validate API responses using the appropriate shared Zod schema.
- Keep request and response handling here.
- Do not import React or TanStack Query.
- Do not implement UI workflows, toast notifications, or navigation.

#### `queries.ts` - Query definitions

Contains the feature's query keys and `queryOptions()` definitions.

Rules:

- Define an `<feature>Queries` object.
- Use consistent, hierarchical query keys.
- Include `organisationId` in organisation-scoped query keys.
- Provide an `all(organisationId)` root key for invalidation.
- Build query functions using the API functions.
- Keep query definitions independent of React components and hooks.

Example key structure:

```ts
['devices', organisationId, 'list', filters];
```

Use the existing feature's query-key conventions when extending it.

#### `hooks/use-x-queries.ts` - Read hooks

Contains React hooks that consume the feature's query definitions.

Rules:

- Use `useQuery()` with the corresponding query options.
- Use `select` when a hook needs to expose transformed data.
- Use `skipToken` for optional query parameters when appropriate.
- Return the query result directly unless the hook has a clear reason to expose a different API.
- Do not put UI rendering or component-specific logic here.

#### `hooks/use-x-mutations.ts` - Write hooks

Contains mutation hooks for create, update, delete, and other write operations.

Rules:

- Use `useMutation()`.
- Handle cache invalidation or `setQueryData()` here.
- Use the feature's query-key hierarchy.
- Return the mutation result directly.
- Do not handle page navigation, dialog closing, or UI toast notifications here.

The component or workflow hook that initiates the mutation owns those UI responsibilities.

#### Other feature hooks - UI workflows

Use feature hooks for cohesive workflows that coordinate multiple operations.

Examples:

- Form initialization and submission.
- Multi-step creation workflows.
- Dialog and action state.
- Polling and debouncing.
- Coordinating multiple mutations.
- Permission-dependent actions.

Keep these hooks independent of presentation components.

Do not create a hook for a simple operation that is already clear inside its component.

#### `lib/` - Pure business logic

Contains framework-independent functions.

Examples:

- Change-set generation.
- Filtering and sorting.
- Data transformation.
- Validation helpers.
- Domain-specific calculations.

Rules:

- Prefer pure functions.
- Avoid side effects.
- Do not import React, TanStack Query, Axios, API functions, query definitions, or feature hooks.
- Keep functions independently testable.
- Do not move ordinary component-specific formatting here without a genuine reuse or testing benefit.

#### Components and `page.tsx` - Presentation

Responsible for rendering UI and connecting it to feature hooks.

Rules:

- Consume data through feature hooks.
- Keep components focused on presentation and user interaction.
- Use inline handlers for simple operations.
- Extract complex workflows into feature hooks.
- Do not call `useQuery`, `useMutation`, or `useQueryClient` directly in presentation components.
- Do not import API functions, query definitions, or Axios.
- Keep loading, error, empty, and content states explicit.

### Axios restriction

Only `src/app/shared/utils/api-request.ts` may import Axios.

All feature API requests must use the shared API client.

## 4. TanStack Query Conventions

Use TanStack Query as the single source of truth for server state.

Follow these conventions:

**Destructure query results with explicit names and defaults:**

```ts
const { data: devices = [], isPending } = useFetchDevices(organisation.id);

const { mutateAsync: create, isPending: isCreating } = useCreateDevice(organisation.id);
```

Avoid spreading the entire query result:

```ts
// Avoid
return {
  ...query,
  devices: query.data ?? [],
};
```

TanStack Query tracks which result properties are accessed. Spreading the result accesses its properties and can disable tracked-property optimisations, causing unnecessary updates.

Prefer explicit property access and return only what the caller needs.

For mutations:

- Invalidate the smallest appropriate query scope.
- Use `setQueryData()` when the updated server data is already available and the cache can be updated safely.
- Avoid unnecessary invalidation of unrelated queries.
- Never duplicate server state in local React state without a specific requirement.

## 5. React and TypeScript Conventions

### Component and hook responsibilities

- Components render UI.
- Hooks coordinate React state and workflows.
- API functions communicate with the backend.
- Query definitions describe server-state operations.
- Pure functions handle reusable domain logic.

Do not combine unrelated responsibilities into one large component or hook.

### State management

- Use local state for transient UI state.
- Use TanStack Query for server state.
- Use React Hook Form for form state.
- Avoid duplicating values that can be derived from existing state.
- Keep state as close as possible to the components that use it.
- Avoid effects for values that can be calculated during rendering.

Do not use `useEffect()` to synchronously derive state from props or other state. Prefer derived values, reactive form values, or an appropriately keyed component depending on the requirement.

### Error handling

Always use:

```ts
getErrorMessage(cause, 'Unable to complete the operation.');
```

Import it from:

```ts
@/app/shared/utils/error-message
```

Avoid repeating custom error extraction logic such as:

```ts
cause instanceof Error ? cause.message : 'Something went wrong';
```

### Type safety

- Prefer explicit, meaningful types.
- Use existing shared schemas and types where appropriate.
- Use type guards when narrowing uncertain values.
- Avoid `any`, non-null assertions (`!`), and unsafe type assertions (`as`) unless justified.
- Do not use `as never` to bypass type errors.
- Handle exhaustive unions and switch statements properly.

Reference implementations:

- `dashboards/shared/lib/is-one-of.ts`
- `templates/shared/lib/parameters.ts`

## 6. Code Quality and Lint Rules

Run:

```bash
bun run lint
```

Lint rules enforce both architectural constraints and code-quality conventions.

### Errors

Errors must be fixed. They indicate violations of enforced rules, including:

- Invalid dependency direction.
- Type safety violations.
- Accessibility issues.
- React Hooks violations.
- Inconsistent type imports and exports.
- Other configured correctness rules.

Do not bypass errors with inline ESLint suppressions, unsafe casts, or configuration changes merely to make lint pass.

If a suppression is genuinely necessary, keep it narrowly scoped and document why.

### Warnings

Warnings identify code that deserves review. Fix them when doing so improves the implementation.

Do not introduce awkward abstractions or unnecessarily fragmented code just to eliminate a warning.

Pay particular attention to these patterns:

**Return early**

Prefer guard clauses over deeply nested conditions.

```ts
if (!template) {
  return;
}

if (!canEdit) {
  return;
}

saveTemplate(template);
```

**Avoid nested ternaries**

For loading, error, empty, and content states, prefer explicit branches or a small component with early returns.

See `locations/list/page.tsx` and its `LocationsContent` component.

**Avoid conditional spreads**

Prefer constructing conditional values explicitly.

```ts
const menu: PageMenuItem[] = [];

if (can.delete) {
  menu.push({
    label: 'Delete',
    onSelect: openDelete,
  });
}
```

Avoid:

```ts
const menu = [...(can.delete ? [{ label: 'Delete', onSelect: openDelete }] : [])];
```

**Avoid unnecessary nesting**

Keep conditional branches readable. Use guard clauses and extract cohesive operations when the function becomes difficult to understand.

**Function complexity**

A complexity warning means a function has too many independent execution paths.

When a function exceeds the configured complexity limit:

1. Identify the branches contributing to the score.
2. Check whether the function has multiple responsibilities.
3. Extract cohesive operations into focused helpers or hooks.
4. Keep related control flow together.
5. Avoid extracting trivial conditions into meaningless functions.
6. Do not increase the lint threshold simply to hide the warning.

For example, a hook coordinating form submission, template creation, and template updates may benefit from separating those workflows.

**File size**

Files exceeding 400 lines generate a warning.

Split files at meaningful boundaries, such as:

- Independent form steps.
- Distinct page sections.
- Reusable feature components.
- Separate workflows.
- Pure business logic.

Do not split files arbitrarily just to satisfy the line limit.

## 7. Accessibility and UI

All new and modified UI must follow the existing accessibility and component conventions.

- Use semantic HTML elements.
- Give every form control an accessible name.
- Associate labels with their corresponding inputs.
- Use `aria-describedby` for supporting descriptions when appropriate.
- Ensure interactive elements are keyboard accessible.
- Use buttons for actions and links for navigation.
- Preserve focus management in dialogs and other overlays.
- Respect reduced-motion preferences.
- Do not introduce clickable non-interactive elements.
- Use the existing shared UI components and design tokens.

Do not introduce a new component library, styling system, or interaction pattern without a clear architectural reason.

## 8. AI Agent Workflow

Before changing code, follow this workflow.

### Step 1: Understand the existing implementation

- Read this guide.
- Inspect the target feature and its neighbouring files.
- Identify the relevant API functions, query definitions, hooks, types, and components.
- Inspect existing usage of the functionality being modified.
- Check the Devices feature for established patterns when needed.

Do not assume a file structure or API contract without inspecting the code.

### Step 2: Plan the change

Identify:

- Which layers need modification.
- Whether an existing hook or utility can be reused.
- Whether the change affects query caching or invalidation.
- Whether permissions or organisation scoping are involved.
- Whether existing UI behaviour must be preserved.

Keep the change focused on the requested task.

### Step 3: Implement

- Follow the dependency direction.
- Reuse existing components, hooks, utilities, and schemas.
- Keep code feature-local unless it is genuinely cross-feature.
- Avoid unnecessary dependencies and abstractions.
- Preserve existing naming and formatting conventions.
- Handle loading, error, empty, and success states.
- Maintain accessibility and type safety.

### Step 4: Validate

Run the following commands from `client/`:

```bash
bun run lint
bunx tsc --noEmit
bun run format
```

Fix errors introduced by the change.

Review warnings and resolve those that can reasonably be addressed without degrading the implementation.

If the project has relevant tests, run them as well.

### Step 5: Review the final changes

Before finishing, verify:

- No architectural boundaries were violated.
- No unnecessary files, dependencies, or abstractions were introduced.
- No existing functionality was accidentally removed.
- No unsafe type assertions or unexplained lint suppressions were added.
- Query invalidation and organisation scoping remain correct.
- UI states and accessibility requirements are handled.
- Formatting and type checking pass.

In your final response, briefly report what changed, important implementation decisions, and the validation commands executed. Mention any checks that could not be completed.

## 9. Non-Negotiable Rules

1. Never import feature code into `src/app/shared/`.
2. Never import Axios outside `api-request.ts`.
3. Never call TanStack Query APIs directly from presentation components.
4. Never put UI side effects such as toasts or navigation inside API or mutation hooks.
5. Never duplicate server state unnecessarily.
6. Never bypass type errors or lint rules without a justified reason.
7. Never refactor unrelated code while completing a focused task.
8. Never claim that lint, tests, or type checking passed unless they were actually executed.

**The objective is consistent, maintainable, type-safe client code. Prefer the simplest implementation that respects these boundaries.**
