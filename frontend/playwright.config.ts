import { defineConfig } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
// Use a disposable database and no vendor credentials by default.
const target = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:8001'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: target,
    viewport: { width: 1366, height: 900 },
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.ATLAS_CHROMIUM_PATH },
  },
  webServer: process.env.ATLAS_TEST_URL
    ? undefined
    : {
        command:
          'python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --no-access-log',
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        url: target + '/api/v1/health',
        reuseExistingServer: false,
        env: {
          ATLAS_ENVIRONMENT: 'test',
          ATLAS_DATA_DIR: mkdtempSync(join(tmpdir(), 'atlas-e2e-')),
          ATLAS_OWNER_TOKEN: '',
          GROQ_API_KEY: '',
          TAVILY_API_KEY: '',
          OPENWEATHER_API_KEY: '',
          ATLAS_REQUEST_LIMIT: '600',
        },
      },
})
