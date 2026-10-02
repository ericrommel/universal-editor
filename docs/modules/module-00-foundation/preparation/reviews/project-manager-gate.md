# Module 0 — Project Manager gate

## Role and limit

| | |
| --- | --- |
| Role | AI Project Manager |
| Document | Definition of Ready check of the revised Module 0 architecture proposal |
| Date | 2026-10-02 |
| Status | Not authorization. Not GREEN. Not Ready for Development. |

This file is review evidence. It does not approve Module 0, does not authorize implementation, and does not move GitHub issue #1 or the project board. Work status lives on issue #1 and the Universal Visual Creation Platform board. This file does not record a board column.

The Human Product Owner has not authorized implementation. `docs/engineering/architecture.md` is **Proposed. Not approved.** ADR-0001 through ADR-0008 are Proposed. The specification stays PLANNED until that authorization is explicit. This gate is not GREEN (development-process section 20) and is not Ready for Development.

Requirements and acceptance criteria were not changed. Development-process section 21 forbids rewriting them to match an implementation.

## Decision classes

Every decision in the revised architecture and in ADR-0001 through ADR-0008 uses one class:

- **Binding for Module 0.** Required to implement and verify this module. A change during implementation needs an ADR revision.
- **Revisitable direction.** Analysis the foundation should not accidentally close. Not a commitment to build that shape.
- **Deferred.** Not decided.

Revisitable direction and deferred items are intentionally not binding. A later authorization, if given, adopts the binding column only.

ADR-0001 opens on that split. TypeScript for the packages Module 0 creates is binding. A later measured numeric function behind a narrow boundary is revisitable. The language of the authoritative scene, and of any later core that replaces these packages, is deferred. The ADR does not change product scope.

## Product Owner confirmations

Four confirmations are required before Ready for Development. There are not five.

The removed confirmation is "one UI package for later desktop." That item is deferred, not a Module 0 gate. Whether later desktop chrome reuses the Module 0 UI package is not decided. Module 0 has one UI package because it has one screen. That does not select a later toolkit.

1. **Authorize this proposal**, including ADR-0001 through ADR-0008, without changing Module 0 requirements or acceptance criteria. Authorization adopts the binding column only. Revisitable direction and deferred items stay open.
2. **Primary development environment.** 64-bit Windows x64 for documented setup and local launch. Required CI on `windows-2025` and `ubuntu-24.04`. Manual `pnpm dev` uses current Microsoft Edge or current Google Chrome, and the evidence records which one. Web, Windows, macOS, and Linux remain the product targets. Module 0 does not implement all of them.
3. **Module 0 shell.** A loopback web shell. Electron, Tauri, and a native GPU stack are not part of Module 0.
4. **Design intent.** The foundation screen in the design review, or a correction of the heading `Universal Visual Creation Platform`, no icon in Module 0, system light/dark with a light fallback, and the purpose sentence in that review. The window title `Foundation` is a purpose label, not a product name.

None of the four adds or deletes an FR, NFR, or AC. The proposal's other not-decided items, including license, public format, undo, scene count, desktop host, and telemetry, are also deferred. They are not Module 0 gates and they are not requirement changes.

## Definition of Ready

Checked against development-process section 8 and the revised proposal. States are **Met**, **Not met**, or **Met pending Product Owner confirmation**.

| Ready condition | State | Basis |
| --- | --- | --- |
| Objective, scope, and out-of-scope behavior are explicit | Met | Operational specification. The proposal says that text is unchanged. |
| Dependencies are identified | Met | No earlier product module. Node.js 24 LTS and pnpm 12.x are named. Exact patches are pinned on implementation day, not invented here. |
| Required earlier modules are approved | Met | None. Module 0 is first. |
| FR, NFR, and AC identifiers are stable | Met | Unchanged. Requirements and acceptance criteria were not changed. |
| Acceptance criteria are observable and testable | Met | The criteria text is unchanged. Confirmations 2 and 3 name how launch criteria are executed. They do not rewrite the criteria. |
| Test approach for every FR, NFR, and AC, or a documented deferral | Met | The revised proposal points to the updated test plan. This check adds no path and removes none. No tests were run. There is no implementation. |
| Required design behavior is sufficiently defined | Met pending Product Owner confirmation | Adopted design review. Confirmation 4 can still correct the stated strings. |
| Test infrastructure and reference workloads, where applicable | Met | Test plan and ADR-0005 for Module 0. Reference hardware and product performance workloads are deferred and are not a Module 0 gate. |
| Blocking security or trust-boundary questions, where applicable | Met | The proposal records preparation findings as addressed by ADR-0007. M0-AC-011 still needs implementation evidence. This gate is not that review. |
| Blocking architectural decisions for Module 0 | Met pending Product Owner confirmation | Binding decisions are proposed in the architecture and in ADR-0001 through ADR-0008. They are not approved. Confirmation 1 is that authorization. |
| Blocking product ambiguities are resolved | Not met | The four confirmations above are still open. |
| The Product Owner authorizes implementation | Not met | No authorization exists. This file must not be read as one. |

The open rows are Product Owner confirmation and authorization. That keeps the module out of Ready for Development. It does not mean the binding proposal is an incomplete engineering draft, and it is not GREEN.

## Work packages

WP-0 through WP-6 stay inside Module 0. No package adds a scene, a user save, undo, a viewport, a GPU, or a desktop host.

| ID | Stop line |
| --- | --- |
| WP-0 | Workspace and checks only. No scene package and no desktop host. |
| WP-1 | Numeric helpers and a closed provisional manifest codec. No scene type and no public format. |
| WP-2 | Editor startup session only. No selection, tool, panel, undo, or viewport API. Waits for WP-1. |
| WP-3 | Snapshot value and null renderer. Empty draw list. No canvas or GPU. May overlap WP-1 after WP-0. |
| WP-4 | Foundation screen and loopback shell. No editor frame and no second toolkit. Waits for WP-2. |
| WP-5 | Verify, CI, Dependabot, and developer documentation. No installer and no performance gate. Waits for WP-1 through WP-4. |
| WP-6 | Short-lived failing-test evidence, then removal. The red commit is not merged. |

WP-1 and WP-3 may overlap after WP-0. WP-2 waits for WP-1. WP-6's red commit is not merged.

## Limit of this record

This file replaces the earlier five-confirmation gate. It does not claim that specialist reviews of the revised architecture are finished. It does not set Ready for Development, Done, or Approved.
