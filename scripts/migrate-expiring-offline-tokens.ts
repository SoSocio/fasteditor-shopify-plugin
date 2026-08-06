import {migrateLegacyOfflineTokens} from "../app/services/offlineTokenMigration.server";

function readPositiveIntegerArgument(name: string): number | undefined {
  const prefix = `${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));

  if (!value) return undefined;

  const parsed = Number(value.slice(prefix.length));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const limit = readPositiveIntegerArgument("--limit");
  const result = await migrateLegacyOfflineTokens({
    dryRun: !execute,
    limit,
  });

  console.info(JSON.stringify({execute, ...result}, null, 2));

  if (result.failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[offline-token-migration] Unexpected failure", error);
  process.exitCode = 1;
});
