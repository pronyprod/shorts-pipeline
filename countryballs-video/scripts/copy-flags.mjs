// Copies the flag-icons SVGs into public/flags so Remotion can load them with staticFile().
import { cpSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
for (const ratio of ["1x1", "4x3"]) {
  cpSync(
    path.join(root, "node_modules", "flag-icons", "flags", ratio),
    path.join(root, "public", "flags", ratio),
    { recursive: true },
  );
}
console.log("Flags copied to public/flags");
