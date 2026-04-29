import { execSync } from "child_process";
import { readdirSync, renameSync } from "fs";
import { resolve, join } from "path";

const migrationName = process.argv[2] || "new-migration";

console.log(`Generating migration: ${migrationName}...`);
execSync(`npx sequelize-cli migration:generate --name ${migrationName}`, { stdio: "inherit" });

const migrationsDir = resolve("migrations");
const files = readdirSync(migrationsDir);

files.forEach((file) => {
  if (file.endsWith(".js")) {
    const oldPath = join(migrationsDir, file);
    const newPath = join(migrationsDir, file.replace(/\.js$/, ".cjs"));
    renameSync(oldPath, newPath);
    console.log(`Automatically renamed: ${file} -> ${file.replace(/\.js$/, ".cjs")}`);
  }
});
