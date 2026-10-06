# Module 3 preparation — inherited product design

**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-06
**Status:** Preparation input for issue #9. Not a design specification. Not implementation authorization.

No Product Owner request. No mockup. No code. This note does not draft issue #40 and does not open issue #49.

## Foundation screen

The purpose string in `packages/ui/src/strings.ts` says this build only proves the application foundation and that creation tools are not part of it.

The Product Owner approved pull request #50 as the Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562). That contract leaves the foundation screen unchanged and has no viewport. Module 1 is not GREEN. The pull request is not merged.

Creation tools stay off the foundation screen, including a disabled toolbar. A creation surface is not authorized by that approval.

## Creation surface

Issue #49 is the default creation surface. It is not the foundation screen, and it is not issue #40.

Discoverability of creation actions cannot be evidenced until a creation surface exists. This note does not claim it was observed.

This note does not specify the shape set, the text-editing interaction, the image-import flow, or color controls.

## Left open from Module 2

Issue #40 is a later Module 2 operational specification. It must not be drafted from the Module 2 preparation notes alone.

The Module 2 interaction note recommends a viewport that replaces the foundation content root. Whether it does is still a later Product Owner question on issue #40. This note does not answer it.

These four disagreements stay open:

1. **Box move.** The axis handle under the pointer, versus a body drag that produces move. The rectangle face drag is not this disagreement.
2. **Undo reselection.** Reselect the affected node on undo and on redo, versus leaving selection unchanged.
3. **Redo shortcut.** Ctrl+Shift+Z and Cmd+Shift+Z, and not also Ctrl+Y, versus Ctrl+Y and Shift+Z.
4. **Hit-test method.** A later pure CPU test that returns an id or a miss, versus CPU picking versus a pick buffer, which stays deferred.
