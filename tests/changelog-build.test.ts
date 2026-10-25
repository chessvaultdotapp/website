import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

for (const scenario of ["missing", "stale"]) {
  test(`build rejects ${scenario} changelog snapshot`, async () => {
    const root = await mkdtemp(join(tmpdir(), "changelog-build-"));
    try {
      for (const path of ["src", "public", "package.json", "astro.config.mjs", "tsconfig.json", "changelogs.json"]) {
        await cp(path, join(root, path), { recursive: true });
      }
      await symlink(resolve("node_modules"), join(root, "node_modules"), "dir");
      if (scenario === "stale") {
        await mkdir(join(root, ".cache/chessvault"), { recursive: true });
        await writeFile(
          join(root, ".cache/chessvault/validated.json"),
          JSON.stringify({ tag: "v0.0.0", commit: "0".repeat(40) }),
        );
      }
      const result = spawnSync(process.execPath, [resolve("node_modules/astro/bin/astro.mjs"), "build"], {
        cwd: root,
        encoding: "utf8",
        timeout: 60_000,
      });
      assert.notEqual(result.status, 0);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes(scenario === "missing" ? "Changelogs are missing" : "Changelogs are stale"), output);
      assert.ok(output.includes("pnpm changelogs:fetch"), output);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
