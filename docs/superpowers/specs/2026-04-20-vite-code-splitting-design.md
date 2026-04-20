# Vite Code Splitting Design

**Goal**

Reduce initial JavaScript work for the tower defense app by moving the Phaser runtime behind an async bootstrap boundary and by teaching Vite how to emit stable game/vendor chunks during production builds.

**Current State**

`/src/main.js` statically imports `/src/phaser/game.js`, which in turn statically pulls Phaser and every scene into the initial entry graph. The project does not currently define a `vite.config.js`, so Rollup chunking relies entirely on defaults.

**Approved Approach**

1. Keep `index.html` and the DOM shell unchanged.
2. Move game startup into a small async bootstrap module that performs tower icon hydration immediately, then lazy-loads the Phaser game module.
3. Add a `vite.config.js` with `build.rollupOptions.output.manualChunks` so Phaser and other third-party packages split into predictable chunks instead of collapsing into a single opaque vendor blob.
4. Add regression tests that assert the entrypoint uses dynamic import and that the Vite config contains chunking rules for Phaser and generic vendor dependencies.

**Constraints**

- Preserve the existing `#game-root` mount and battle controls markup.
- Do not refactor scene logic for this change.
- Keep the bootstrap logic small and explicit so the async loading boundary is easy to verify in tests.

**Verification**

- `node --test test/code-splitting.test.js`
- `npm test`
- `npm run build`
