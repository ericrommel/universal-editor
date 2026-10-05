# Module 0 known limitations

These are residuals. They are not blocking findings, and they are not a request to change Module 0 requirements.

- Module 0 has no scene, viewport, undo stack, save command, desktop host, installer, or GPU backend.
- `@uvcp/platform` is the host boundary and has no runtime API. The shell declares the dependency and does not import it.
- Graphical launch evidence is one headed browser on the primary machine: Microsoft Edge 154.0.4258.53 on Windows 11 Pro. It is not a browser matrix and not a macOS or Linux desktop.
- The cold-store timing file still says `host: windows` and does not store the edition. The edition of the 2026-10-05 machine is in `reproducibility.md`. The durations are not pass/fail thresholds.
- The design review waived four non-blocking differences: the focus outline is reported as 1.6px at 125% scaling while the stylesheet says 2px; the details control uses native button chrome; the top inset switches at a 640px viewport; the browser window is not clamped to 640 by 480.
- The production content security policy is a response header from `vite preview`. A later static host has to send that same header. Module 0 does not add that host.
- The license check reads the packages installed on that operating system. Optional packages for another OS are not installed there. At review they were permissive.
- ASCII case-fold for provisional entry names remains. Module 0 does not extract a project.
- Repository admin settings are outside this module. Actions already runs the verify workflow. Branch protection that requires the verify check was not changed. The approved architecture does not make that setting a Module 0 gate.
- Draft pull request 28 is failure evidence. It must not be merged.
