---
paths:
  - "components/admin/form-builder/**"
  - "lib/types/registration-form.ts"
  - "lib/validators/registration-form.ts"
  - "lib/actions/registration-forms.ts"
  - "components/public/features/registration/**"
---

# Registration form builder

The admin authoring UI for `/admin/rocniky/[id]/registrace/formular` lives under `components/admin/form-builder/`. It is the only place in the codebase that uses a flat in-memory data model — everything outside the builder consumes the nested DB shape.

## Two shapes — one boundary

- **Nested shape** (`FormElement[]` with `ConditionBlock.children`): what is in the DB (`RegistrationForm.fields` JSON), what the 28 consumer files outside the builder read, what Zod validates on save.
- **Flat shape** (`FlatElement[]` with `parentBlockId`): what the builder uses internally so the canvas can be a single `SortableContext`. Every row renders as a direct child of the canvas — the block "body" is CSS-only (left border + indent on child rows). This is the reason cross-container drag does not re-mount field rows.

`form-data-adapter.ts` owns the boundary: `nestedToFlat` on load (in `useFormBuilderState`'s `initFromData`) and `flatToNested` on save (`getFormData()`). **Never leak `FlatElement` outside the builder.**

## Contiguity invariant

In `FlatElement[]`, a block's children always appear directly after the block row and before the next root row. `applyMove` in `use-form-builder-state.ts` is responsible for maintaining this invariant; `flatToNested` relies on it. If you add a new reducer action that touches `elements`, preserve contiguity or write an explicit re-grouping pass.

## File map

```
form-builder.tsx            shell: orchestration, dialogs, save/preview/delete
form-builder-canvas.tsx     DndContext (stable id="form-builder-dnd") + single SortableContext;
                            computes BlockPosition (head/middle/tail/solo/standalone) per row
form-builder-toolbar.tsx    Save / Preview / "Kopírovat odkaz"
form-builder-dialogs.tsx    DeleteFormDialog + DeletionBlockDialog
use-form-builder-state.ts   reducer (formBuilderReducer, applyMove, initFromData exported for reuse)
use-form-builder-dnd.ts     sensors, collisionDetection, drag handlers (onDragOver is a no-op),
                            palette drops; move dispatch happens only in onDragEnd
use-form-validation.ts      pure validators for delete + save (reasonsToBlockField*)
drag-overlay.tsx            DragOverlay content
form-data-adapter.ts        nestedToFlat / flatToNested + types
form-builder-helpers.ts     pure helpers, single makeBlankField (no duplicate factories)
block-header-row.tsx        block "header" row content only — bg + rail owned by the outer
                            SortableFieldItem so they tile continuously with children
sortable-field-item.tsx     BlockPosition-driven tiling: standalone rows = outlined Paper;
                            block group rows share continuous left rail + muted bg, no gap
                            between rows in the group, rounded corners only at head/tail;
                            block-child rows wrap their content in an inner outlined white
                            Paper card with gutter, matching the master visual
field-list-item.tsx         memoized; onEdit/onDelete receive the field/id (stable refs)
```

## Conventions

- One factory for blank fields — `makeBlankField` in `form-builder-helpers.ts`. Do not write a second one.
- Validators are pure — `use-form-validation.ts` exports `reasonsToBlockFieldDelete` and `reasonsToBlockFieldSave` independently of React; the hook is just a binding convenience.
- The reducer is pure (`formBuilderReducer` / `applyMove` / `initFromData` are exported for reuse). When you add a new action, also extend the discriminated union `FormBuilderAction`.
- Dispatch from `useReducer` is stable; depend on it explicitly in `useCallback`/`useMemo` deps to satisfy `react-hooks/exhaustive-deps`.
- Block rows live only at root (`parentBlockId: null`). Blocks must never nest. `applyMove` rejects moving a block into another block.
- **DnD model: commit on drop, not on dragOver.** `onDragOver` is intentionally a no-op. The visual sibling shift during dragging is handled by dnd-kit via CSS transforms; the data move is dispatched once in `onDragEnd`. Reason: per-frame `setElements` during drag was thrashing the canvas and combined with MUI Tooltip's `useState`-backed refs and React 19 StrictMode's synthetic unmount pass it hit "Maximum update depth exceeded" when the pointer oscillated between drop targets. Two no-op guards exist defensively: `isAlreadyAtSlot` in `use-form-builder-dnd.ts` (1-based "after-position" — skip dispatch entirely when the target slot is already where the active item sits) and `isAlreadyAtTarget` in `use-form-builder-state.ts` (0-based "current-position" — return the same `elements` reference if `applyMove` would be a no-op). The two answer slightly different questions and both stay; do not collapse them unless you also re-verify the StrictMode repro.
- **DndContext id must be stable** (`id="form-builder-dnd"`) — `@dnd-kit` uses a module-level counter inside `useUniqueId` for `aria-describedby` IDs, which de-syncs between server and client on SSR. An explicit `id` short-circuits the counter.
- **Block-group visual tiling** is driven by `BlockPosition` ("standalone" / "block-solo" / "block-head" / "block-middle" / "block-tail") computed in `form-builder-canvas.tsx` from `parentBlockId` and the *next* element's parent. `sortable-field-item.tsx` consumes it. The block-head ↔ block-tail computation is what gives the continuous rail and shared bg the look of a single block container even though every row is a separate React component (which is what enables the drag-without-remount property).

## Testing

- Verified through Playwright (E2E) — no unit-test runner is wired up. When changing reducer or adapter logic, reproduce manually via playwright-mcp on the seed.
- Drag perf baseline on the seed (~39 sortable items): `0` console errors during a 200-step cross-block drag, max frame `≤ 150 ms`, FPS `≥ 70`.
- StrictMode-amplification repro: drag a block-with-children over another block-with-children and oscillate the pointer on the border for 3 s; expect `0` console errors (specifically no "Maximum update depth exceeded"). If you change the DnD model, run this repro before merging.

## Public consumption

The veřejný formulář (`components/public/features/registration/DynamicRegistrationForm.tsx` and `useConditionalFields.ts`) reads the nested shape directly from `getRegistrationStatus()`. It uses `getAllFields(formData.fields)` to flatten for rendering and `isConditionBlock(el)` to recurse for visibility. If you change the nested shape or the adapter, **manually verify the public form still renders and conditional fields still trigger** — the round-trip is data-loss-safe in tests but cosmetic regressions land in the public form first.
