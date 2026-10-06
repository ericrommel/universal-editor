**Role:** Functional Quality Engineer

**Concur.** At commit `5290d80048ee7ec3bf46edf4d0fdf32273377c9d`, the test plan is a fit functional verification approach for the proposed Module 1 specification. This review does not approve the module, does not authorize implementation, and is not the Product Owner gate in development process section 8.

Compared `specification.md`, `test-plan.md`, and `preparation/reconciliation.md` with development process sections 8 and 9. No scene test was added. No acceptance criterion was changed. No test run is claimed.

## Checks

Every `M1-FR`, `M1-NFR`, and `M1-AC` identifier appears in the test plan. The map is below.

TP-M1-F-004, F-005, F-006, F-007, and F-008 each name one result. The old pair on those rows was a proposal result and a different review result. That pair is not still in the text. More than one `Expected result` label under F-004, F-005, F-007, and F-008 is successive checks of the same meaning: where the id is placed, and how a bad index fails; that selection is absent, and that a `selection` key fails; that a positive extent is stored, and that a non-positive extent fails; that the writer has one shape, and that the reader and the cap follow that shape. F-006 has one label. A deferred coordinate or pivot sentence is not a missing test.

Every code and fixed message the plan asserts is the section 8 catalog pair.

| Code | Message the plan asserts | Catalog |
| --- | --- | --- |
| `EMPTY` | Scene document is empty. | Same sentence |
| `NON_FINITE_NUMBER` | Expected a finite number. | Same sentence |
| `INVALID_EXTENT` | Scene extent is not accepted. | Same sentence |

TP-M1-F-010 requires the catalog sentence for each M1-AC-007 code and does not substitute another sentence. The other named codes are catalog codes and are not paired with a different message: `INVALID_ENCODING`, `INVALID_JSON`, `DUPLICATE_KEY`, `INVALID_SHAPE`, `UNSUPPORTED_FORMAT`, `UNSUPPORTED_SCHEMA_VERSION`, `INVALID_ID`, `DUPLICATE_ID`, `INVALID_HIERARCHY`, `UNKNOWN_NODE`, and `TOO_LARGE`.

The plan does not authorize implementation before Product Owner approval. The status line, section 1, section 9, and section 10 say the specification is not approved and that tests are written when implementation is authorized. Development process section 9 is met as a preparation plan: functional and non-functional scenarios, regression, infrastructure, design and security checks, and developer test responsibility after that authorization. Section 8 is not met. The Product Owner has not authorized implementation. Concurrence is not that authorization.

## One result on the five rows

| Scenario | Result in the text | Not a pass condition |
| --- | --- | --- |
| TP-M1-F-004 | Insert at an integer index. The length appends. A bad index on an existing parent is `INVALID_HIERARCHY`. A missing parent is `UNKNOWN_NODE`, including when the index is also bad. | Append-only insert. |
| TP-M1-F-005 | The scene and the document have no selection. A `selection` key is `INVALID_SHAPE`. The foundation screen and `packages/editor` gain no selection. | A selection that round-trips. |
| TP-M1-F-006 | Delete removes that subtree, including when the node still has children, and does not promote children. An unknown id is `UNKNOWN_NODE`. | Delete that fails because the child list is non-empty. |
| TP-M1-F-007 | A stored extent is strictly greater than zero. `0` and `-1` are `INVALID_EXTENT` with message `Scene extent is not accepted.` | Zero or negative extents that round-trip. No pivot. |
| TP-M1-F-008 | One flat document, one writer order, format id `universal-visual-creation-scene`, schema token `1`, and cap 1048576. Exactly 1048576 bytes is not `TOO_LARGE` by length alone. | A second shape, a second writer order, or the 262144 cap. |

## Trace

| Identifier | Scenario |
| --- | --- |
| M1-FR-001 | TP-M1-F-001 |
| M1-FR-002 | TP-M1-F-002, TP-M1-F-013 |
| M1-FR-003 | TP-M1-F-007 |
| M1-FR-004 | TP-M1-F-007 |
| M1-FR-005 | TP-M1-F-003, TP-M1-F-015 |
| M1-FR-006 | TP-M1-F-004 |
| M1-FR-007 | TP-M1-F-006 |
| M1-FR-008 | TP-M1-F-005, TP-M1-F-008, TP-M1-F-011 |
| M1-FR-009 | TP-M1-F-012 |
| M1-NFR-001 | TP-M1-F-002 |
| M1-NFR-002 | TP-M1-F-014, TP-M1-N-002 |
| M1-NFR-003 | TP-M1-F-008, TP-M1-F-009 |
| M1-NFR-004 | TP-M1-F-010, TP-M1-S-001 |
| M1-NFR-005 | TP-M1-F-011, TP-M1-N-003, TP-M1-O-001 |
| M1-NFR-006 | TP-M1-N-001 |
| M1-NFR-007 | TP-M1-F-013, TP-M1-N-002, TP-M1-N-004, TP-M1-S-001 |
| M1-AC-001 | TP-M1-F-002, TP-M1-F-004 |
| M1-AC-002 | TP-M1-F-003, TP-M1-F-015 |
| M1-AC-003 | TP-M1-F-005, TP-M1-F-008, TP-M1-F-009 |
| M1-AC-004 | TP-M1-F-006 |
| M1-AC-005 | TP-M1-N-001 |
| M1-AC-006 | TP-M1-F-011 |
| M1-AC-007 | TP-M1-F-001, TP-M1-F-008, TP-M1-F-010, TP-M1-F-014, TP-M1-N-004 |
| M1-AC-008 | TP-M1-F-007, TP-M1-F-015 |

## Addendum — commit 7085127

**Concur** on the delta in `70851277d78cfcd6d57c21727de15fefb4a450fd`. This addendum does not authorize implementation.

The message `Scene duplicate check lost alignment.` is the same sentence in M1-NFR-004, specification section 9, ADR-0009, and TP-M1-S-001. Each throws `Error` for any walk and parse disagreement other than the duplicate-key case, and none of them accepts a scene from that failure. Section 9 also says the message is fixed, omits the document, and is not `DomainError`. That is the same failure, not a second message.

More raw keys than parsed keys stays `DUPLICATE_KEY` in M1-NFR-004, section 9, and TP-M1-S-001. ADR-0009 calls that case a duplicate-key failure and does not name another code. Repeated keys do not use the alignment message.

The trace table above is unchanged. M1-FR-001 through M1-FR-009, M1-NFR-001 through M1-NFR-007, and M1-AC-001 through M1-AC-008 still have those scenarios. M1-NFR-004 remains TP-M1-F-010 and TP-M1-S-001, and the new check is in TP-M1-S-001.

The test plan status line and section 10 still say the plan does not authorize implementation and that the Product Owner has not approved the specification.
