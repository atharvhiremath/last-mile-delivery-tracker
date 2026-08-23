import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("📦 Creating clean project submission archive...");

const archiveName = "last-mile-delivery-tracker-submission.zip";

try {
  // Use powershell Compress-Archive to package clean repo excluding node_modules, .next, and .git
  const excludeList = ["node_modules", ".next", "dev.db", "dev.db-journal", ".git"];
  
  console.log(`Zipping repository into ${archiveName}...`);
  execSync(
    `powershell -Command "Get-ChildItem -Exclude node_modules,.next,.git,*.db,*.zip | Compress-Archive -DestinationPath ${archiveName} -Force"`,
    { stdio: "inherit" }
  );

  console.log(`✅ Project successfully packaged to ${archiveName}`);
} catch (e) {
  console.error("Zip export error:", e.message);
}
