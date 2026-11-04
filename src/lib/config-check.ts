// Turns deployment mistakes into messages that say what to fix.
// Every message is fixed text, so a connection string or password can never end up in one.

const NO_DATABASE_NAME =
  "DATABASE_URL has no database name. Add nuvosid_walkin right after the slash, like ...mongodb.net/nuvosid_walkin?retryWrites=true";

function databaseUrlProblem(url: string) {
  if (!url.trim()) {
    return "DATABASE_URL is not set. Add your MongoDB Atlas connection string in Vercel → Settings → Environment Variables, then redeploy.";
  }
  if (/^["']|["']$/.test(url.trim())) return "DATABASE_URL has quotes around it. Remove them.";
  if (/\s/.test(url)) return "DATABASE_URL has a space or line break in it. Paste it again without any.";
  if (!/^mongodb(\+srv)?:\/\//.test(url)) {
    return "DATABASE_URL must start with mongodb+srv://. Copy it again from MongoDB Atlas → Connect → Drivers.";
  }
  if (/<[^>]*>|USER:PASSWORD@CLUSTER/.test(url)) {
    return "DATABASE_URL still has a placeholder such as <db_password>. Replace it with the real password.";
  }

  const afterScheme = url.replace(/^mongodb(\+srv)?:\/\//, "").split("?")[0];
  const at = afterScheme.lastIndexOf("@");
  if (at !== -1 && /[@/#]/.test(afterScheme.slice(0, at))) {
    return "The password in DATABASE_URL has special characters such as @ or /. Change it to letters and numbers in Atlas → Database Access.";
  }
  const databaseName = afterScheme.slice(at + 1).split("/")[1];
  if (!databaseName) return NO_DATABASE_NAME;

  return null;
}

export function findConfigProblems(env: Record<string, string | undefined> = process.env) {
  const problems: string[] = [];
  const databaseProblem = databaseUrlProblem(env.DATABASE_URL ?? "");
  if (databaseProblem) problems.push(databaseProblem);
  if ((env.AUTH_SECRET ?? "").length < 32) {
    problems.push("AUTH_SECRET is not set or is under 32 characters. Copy it from your .env file.");
  }
  return problems;
}

export function explainDatabaseError(message: string) {
  if (/ADMIN_PASSWORD is not set/.test(message)) {
    return "ADMIN_PASSWORD is not set, so the first admin can't be created. Add it in Vercel → Settings → Environment Variables.";
  }
  if (/authentication ?failed|bad auth|scram/i.test(message)) {
    return "MongoDB Atlas rejected the username or password in DATABASE_URL. Check them in Atlas → Database Access.";
  }
  if (/server selection timeout|no available servers/i.test(message)) {
    return "Can't reach the database. In MongoDB Atlas → Network Access, add 0.0.0.0/0.";
  }
  if (/dns resolution|no record found/i.test(message)) {
    return "The cluster address in DATABASE_URL wasn't found. Copy the connection string again from MongoDB Atlas.";
  }
  if (/invalidnamespace|database must be defined/i.test(message)) return NO_DATABASE_NAME;
  if (/query engine/i.test(message)) return "The database engine is missing from this deployment. Redeploy without the build cache.";
  if (/replica set/i.test(message)) return "The database must run as a replica set. MongoDB Atlas does this automatically.";
  return "Unexpected database error. See the function logs in Vercel → Logs.";
}

/** The reason behind a failed sign-in, for the person who runs the portal. */
export function describeServiceError(error: unknown) {
  return findConfigProblems()[0] ?? explainDatabaseError(error instanceof Error ? error.message : String(error));
}
