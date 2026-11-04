import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { explainDatabaseError, findConfigProblems } from "../src/lib/config-check";

// Runs before `next build`. On a Vercel production deployment it gets the database ready
// (indexes, first admin, demo client), so nothing has to be run by hand. It's safe to repeat:
// existing accounts and data are left as they are. Failing here keeps the last good deployment live.

function stop(reasons: string[]): never {
  console.error("\n=========== DEPLOY SETUP FAILED ===========");
  for (const reason of reasons) console.error(`- ${reason}`);
  console.error("Fix this, then redeploy from the Vercel dashboard.");
  console.error("===========================================\n");
  process.exit(1);
}

function run(args: string[]) {
  const result = spawnSync("npx", args, { encoding: "utf8", env: { ...process.env, DEPLOY_SETUP: "1" } });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  console.log(output);
  if (result.status !== 0) stop([explainDatabaseError(output)]);
}

// VERCEL_ENV only exists while the project's "Enable access to System Environment Variables"
// setting is on. A build with a DATABASE_URL but no local .env file is also a deployment.
const target = process.env.VERCEL_ENV;
const isDeployment = target === "production" || (!target && !existsSync(".env") && !!process.env.DATABASE_URL);

if (isDeployment) {
  const problems = findConfigProblems();
  if (problems.length) stop(problems);

  run(["prisma", "db", "push", "--skip-generate"]);
  run(["tsx", "prisma/seed.ts"]);
}
