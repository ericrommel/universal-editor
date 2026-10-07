# Module 1 — Application Security Concurrence

**Role:** Senior Application Security Engineer

**Reject.** At commit `5290d80048ee7ec3bf46edf4d0fdf32273377c9d`, SEC-M1-B-002 is not one expected result in the specification and not an implementation test of that same result. This record does not weaken ADR-0007, does not choose a different cap, and does not authorize implementation.

## Unmet condition

**SEC-M1-B-002.** The condition requires one fail-closed result when the duplicate walk disagrees with `JSON.parse`: fixed text, and no successful read. It also requires that a reviver used to read a raw token return the value unchanged, not write, and not record `this` when `this` is `Object.prototype` or another intrinsic prototype.

The sentence in `test-plan.md` under TP-M1-S-001 that carries this condition is:

> `JSON.parse` is the only syntax authority. `SyntaxError` and `RangeError` become `INVALID_JSON`. A reviver used to read a raw token returns the value unchanged and does not record `this` when `this` is `Object.prototype`.

That sentence misses the disagreement result. It also misses "must not write" and "or another intrinsic prototype."

Section 8 says "Any object repeats a key: `DUPLICATE_KEY`." That is only the repeated-key result. Sections 7, 8, and 9 do not state what happens when the walk and `JSON.parse` disagree. No other implementation test states that result.

## Checks that are single results

These are not the rejection. Each has one result. The cap is not changed.

- SEC-M1-B-001. Section 8 checks the input in one order. A non-`Uint8Array` is `INVALID_SHAPE`. Empty input is `EMPTY`. `byteLength` greater than 1048576 is `TOO_LARGE` before UTF-8 decode and before parse, including when the extra byte is not UTF-8. A leading BOM or ill-formed UTF-8 is `INVALID_ENCODING`. `JSON.parse` is the syntax step, so a second value is `INVALID_JSON`. M1-AC-007 states the same codes.
- SEC-M1-B-003. Duplicate keys on every object, including escape-equivalent spellings, are `DUPLICATE_KEY`.
- SEC-M1-B-004. The scene is built from known fields and is not the parsed object. Parsed keys are not assigned, spread, or merged. `Object.prototype` stays unchanged after an accepted document and after a rejected document. TP-M1-F-010 tests that result, including a nested `__proto__` value and a `constructor` or `prototype` object. Section 9 rejects `__proto__`, `constructor`, and `prototype`.
- SEC-M1-B-005. Catalog messages are the fixed sentences and nothing else. `cause` is unset. The message does not include the document. TP-M1-F-010 requires the planted sentinel to be absent from `message`, `code`, and `cause`.
- SEC-M1-B-006. `readManifest` and `writeManifest` keep their acceptance, rejection, codes, messages, and 4096-byte cap. ADR-0009 states one result: the duplicate walk is not the manifest function and does not reuse that function's reviver. TP-M1-S-001 states the same result. The manifest gains no nesting-depth limit.
- SEC-M1-B-007. The cap is 1048576. A longer input fails closed as `TOO_LARGE` before decode. A host `RangeError` from `JSON.parse` is `INVALID_JSON` and does not abort the process. A nested document is not an accepted scene. That does not add a depth limit to the manifest.
- SEC-M1-B-008. Module 1 adds no runtime dependency, no filesystem call, no network client, no container, no path or URL, and no `$ref`. The hierarchy walk visits each node at most once, and a structure that is not a tree is `INVALID_HIERARCHY`.
- SEC-M1-B-009. The writer emits bytes from the validated scene. It does not stringify a caller-supplied or previously parsed object. Non-finite numbers are rejected with `Expected a finite number.` and are not written as `null`.

ADR-0007 still binds the shell, CI secrets, closed diagnostics, frozen install, empty `allowBuilds`, the public registry, and the license allow-list. This concurrence does not relax those rules to admit a parser.

## Not done

No exploit, parser, payload, or dependency was written. No scene code was run. This is not Product Owner approval and not a sign-off of an implementation.

## Addendum — commit 7085127

**Role:** Senior Application Security Engineer

**Concur.** At commit `70851277d78cfcd6d57c21727de15fefb4a450fd`, SEC-M1-B-002 is one result. This addendum does not weaken ADR-0007, does not choose a different cap, and does not authorize implementation.

`JSON.parse` is the only syntax authority. The duplicate walk runs only after that parse succeeds. More raw keys than parsed keys is `DUPLICATE_KEY`. Any other disagreement throws `Error` with the message `Scene duplicate check lost alignment.`, returns no scene, and is not a successful read. A reviver used to read a raw token returns the value unchanged, does not return `undefined`, does not write, and does not record `this` when `this` is `Object.prototype` or another intrinsic prototype.

M1-NFR-004, section 9, and the TP-M1-S-001 sentence state that result. ADR-0009 names the same message, the same `Error`, and no second outcome. The rejection at `5290d80` remains the record of the sentence that was missing. This text closes it.

No exploit was written. No scene code was run.
