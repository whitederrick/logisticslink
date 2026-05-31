import { validateProductionEnv } from "../src/lib/env-validation";

const issues = validateProductionEnv(process.env);

if (issues.length > 0) {
  console.error("Production environment check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Production environment check passed.");
