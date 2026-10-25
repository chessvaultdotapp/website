import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

for (const scenario of ["valid", "mismatched commit", "unexpected filename", "empty changelog"]) {
  test(`fetch: ${scenario}`, async () => {
    const root = await mkdtemp(join(tmpdir(), "changelog-fetch-"));
    try {
      const upstream = join(root, "upstream");
      const website = join(root, "website");
      await mkdir(join(upstream, "changelogs"), { recursive: true });
      await mkdir(join(website, "scripts"), { recursive: true });
      await cp("scripts/fetch-changelogs.ts", join(website, "scripts/fetch-changelogs.ts"));
      await writeFile(join(website, "package.json"), '{"type":"module"}');
      await writeFile(
        join(upstream, "changelogs/v1.0.0.md"),
        scenario === "empty changelog" ? " " : "# v1.0.0\n\nReleased notes.",
      );
      if (scenario === "unexpected filename")
        await writeFile(join(upstream, "changelogs/unreleased.md"), "Future notes");
      const git = (...args: string[]) => execFileSync("git", ["-C", upstream, ...args], { encoding: "utf8" }).trim();
      git("init", "--quiet");
      git("add", ".");
      git("-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "Fixture");
      git("tag", "v1.0.0");
      const pin = {
        tag: "v1.0.0",
        commit: scenario === "mismatched commit" ? "0".repeat(40) : git("rev-parse", "HEAD"),
      };
      await writeFile(join(website, "changelogs.json"), JSON.stringify(pin));
      // Redirect the production URL to a local fixture without adding a production override.
      const result = spawnSync(
        process.execPath,
        ["--experimental-strip-types", resolve(website, "scripts/fetch-changelogs.ts")],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            GIT_CONFIG_COUNT: "1",
            GIT_CONFIG_KEY_0: `url.file://${upstream}.insteadOf`,
            GIT_CONFIG_VALUE_0: "https://github.com/chessvaultdotapp/chessvault.git",
            GIT_ALLOW_PROTOCOL: "file",
          },
        },
      );
      if (scenario === "valid") {
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(JSON.parse(await readFile(join(website, ".cache/chessvault/validated.json"), "utf8")), pin);
      } else {
        assert.notEqual(result.status, 0);
        const message =
          scenario === "mismatched commit"
            ? "Release tag does not match"
            : scenario === "unexpected filename"
              ? "Expected only versioned Markdown"
              : "Empty changelog";
        assert.ok(result.stderr.includes(message), result.stderr);
        await assert.rejects(readFile(join(website, ".cache/chessvault/validated.json")), { code: "ENOENT" });
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
