# Tools

Detected by `/sf-setup` on 2026-10-28. Skills use a recorded tool and fall back as the plugin's tools map says when a row reads `none`.

| Kind | Recorded | How to call it |
|---|---|---|
| Headless browser CLI | none | none |
| Chrome DevTools MCP | configured, user scope, `--autoConnect --channel=beta` (attaches to the user's running Chrome Beta; no isolated profile) | MCP tools |
| Image generation | none | none |
| Second-model CLI | none | none |
| Design-check CLI | none | none |
| Direction scripts | Node v24.19.0; Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` | `node <sf-design>/direction/scripts/<script>.mjs` |
