// Runs every .sql file in api/migrations against Supabase via the service role key.
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "migrations");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Supabase doesn't expose a direct SQL HTTP endpoint without a function, so run via the Postgres REST extension:
// We use Supabase's "/rest/v1/rpc/exec_sql" convention if you create the helper function below, OR
// paste the migration SQL directly into the Supabase SQL editor — simpler for first-time setup.

const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();
for (const f of files) {
  const sql = await readFile(join(dir, f), "utf8");
  console.log(`\n-- ${f} --\nPaste this into Supabase SQL Editor (Dashboard > SQL):\n`);
  console.log(sql);
  console.log(`\n-- end ${f} --\n`);
}
console.log("\nAll migrations printed. Run them once in Supabase Dashboard > SQL Editor.");
