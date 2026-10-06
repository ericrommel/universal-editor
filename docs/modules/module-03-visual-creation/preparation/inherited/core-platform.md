# Module 3 preparation — inherited core attachment

**Role:** Senior Core / Platform Engineer

**Status:** Preparation input for issue #9. Not a specification and not implementation authorization.

**Date:** 2026-10-06

Pull request #50, head `13f1725`, is the Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562). That head is not merged. Module 1 is not GREEN. The specification status line still says proposed. This note does not edit it and follows the specification body. Archive section 9.4 identifiers are not operational requirements. Module 3 implementation is not authorized. This note adds no scene type, kind, field, codec, or id generator, and it drafts no creation-data schema. It does not select a container, a color encoding, a shape set, or schema version 2, and it does not ask the Product Owner for a decision.

## Attachment rules

**Kinds.** The closed kinds are `rectangle` and `box`. An unknown kind is `INVALID_SHAPE`. This note does not add a text kind, an image kind, or another shape kind.

**Keys.** Unknown keys are rejected, including `selection`. Appearance, a display name, a text payload, and an image reference are not schema version 1 fields.

**Extents.** Each extent is strictly greater than zero. An extent is not a color, an opacity, or a name. `replaceExtents` keeps the kind.

**Ids.** Every id is caller-supplied under M1-FR-009. Core has no clock and no random source. A later duplicate is a new insert with a second caller-supplied id. Core does not mint that id. This note does not choose how the caller invents it.

**Results.** An accepted operation returns a new frozen scene. A rejected operation leaves the input scene unchanged.

**Bytes.** The scene document cap is 1048576 bytes. The approved reconciliation says that document contains no images. Image bytes do not enter `@uvcp/core` or this document. The cap is not an image budget. The manifest stays the two-field writer with a 4096-byte cap.

**Order.** Hierarchy order is `rootIds` / `roots` and the child id lists. `nodes` array order is not hierarchy. The approved contract has no reorder operation.
