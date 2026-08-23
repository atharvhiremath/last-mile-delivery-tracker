import { execSync } from "child_process";

console.log("📦 Creating clean project submission archive via Git archive...");

const archiveName = "last-mile-delivery-tracker-submission.zip";

try {
  execSync(`git archive -o ${archiveName} HEAD`, { stdio: "inherit" });
  console.log(`✅ Project successfully packaged to ${archiveName}`);
} catch (e) {
  console.error("Zip export error:", e.message);
}
