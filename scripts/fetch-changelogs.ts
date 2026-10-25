import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
process.chdir(fileURLToPath(root));
const pin = JSON.parse(await readFile("changelogs.json", "utf8"));
if (!/^v[\w.+-]+$/.test(pin.tag) || !/^[a-f0-9]{40}$/.test(pin.commit)) {
  throw new Error("Invalid changelogs.json release pin");
}
const directory = resolve(".cache/chessvault");
const git = (...args: string[]) => execFileSync("git", ["-C", directory, ...args], { encoding: "utf8" }).trim();
await mkdir(directory, { recursive: true });
try {
  git("init", "--quiet");
  git("config", "remote.origin.url", "https://github.com/chessvaultdotapp/chessvault.git");
  git("config", "remote.origin.promisor", "true");
  git("config", "remote.origin.partialclonefilter", "blob:none");
  git("sparse-checkout", "set", "--cone", "changelogs");
  git("fetch", "--depth=1", "--filter=blob:none", "origin", `refs/tags/${pin.tag}`);
  if (git("rev-parse", "FETCH_HEAD^{commit}") !== pin.commit) {
    throw new Error("Release tag does not match the pinned commit");
  }
  git("checkout", "--detach", "--force", pin.commit);
  const files = await readdir(`${directory}/changelogs`);
  if (!files.includes(`${pin.tag}.md`) || files.some((file) => !/^v[\w.+-]+\.md$/.test(file))) {
    throw new Error("Expected only versioned Markdown changelogs, including the pinned release");
  }
  for (const file of files) {
    if (!(await readFile(`${directory}/changelogs/${file}`, "utf8")).trim()) {
      throw new Error(`Empty changelog: ${file}`);
    }
  }
  await writeFile(`${directory}/validated.json`, JSON.stringify(pin));
  console.log(`Fetched ${files.length} changelogs at ${pin.tag} (${pin.commit})`);
} catch (error) {
  await rm(`${directory}/validated.json`, { force: true });
  throw error;
}
