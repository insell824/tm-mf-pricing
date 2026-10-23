import { debugLog, logError } from "./logger";
import { findServiceByHost } from "./pricing";
import { mountPricingButton } from "./ui";

function main(): void {
  const { hostname } = location;
  const service = findServiceByHost(hostname);
  debugLog(`host=${hostname} matched=${service?.id ?? "none"}`);
  if (!service) {
    return;
  }
  mountPricingButton(service);
}

try {
  main();
} catch (error) {
  logError("Failed to initialize", error);
}
