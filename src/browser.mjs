import { chromium } from 'playwright';

export function launchBrowser() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  return chromium.launch(executablePath ? { executablePath } : {});
}
