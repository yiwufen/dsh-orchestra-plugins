// src/index.ts
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
var name = "@dsh-orchestra/delegate";
var inject = ["skills"];
function apply(ctx) {
  try {
    if (process.env.ORCH_NODE) return;
    const skills = ctx.skills;
    if (typeof skills?.register !== "function") return;
    const assetsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets");
    let manifest;
    let content;
    try {
      manifest = JSON.parse(readFileSync(join(assetsDir, "skill.json"), "utf8"));
      content = readFileSync(join(assetsDir, "skill.md"), "utf8");
    } catch {
      return;
    }
    if (typeof manifest?.name !== "string" || typeof manifest?.description !== "string") return;
    const dispose = skills.register({
      name: manifest.name,
      description: manifest.description,
      content,
      source: "bundled",
      invocation: { modelInvocable: true, userInvocable: true },
      resourceBase: { kind: "directory", path: assetsDir }
    });
    ctx.effect?.(() => dispose);
  } catch {
  }
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map