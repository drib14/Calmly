import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173', // Client URL
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd server && node index.js',
      port: 5080,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: '5080',
        MONGO_URI: 'mongodb+srv://jhondrib:jhondrib@cluster1.gcx5yt0.mongodb.net/Calmly?retryWrites=true&w=majority&appName=Cluster1',
        ACCESS_TOKEN_SECRET: 'superultramegasecret',
        REFRESH_TOKEN_SECRET: 'superultramegasecret',
        CLOUDINARY_CLOUD_NAME: 'drcuvibon',
        CLOUDINARY_API_KEY: '869547646199562',
        CLOUDINARY_API_SECRET: 'Y6Kks9-hJxn4XI3QHNC3oxbmehU',
        CLIENT_URL: 'http://localhost:5173',
        EMAIL_USER: 'jhondribramirez7@gmail.com',
        EMAIL_PASS: 'zqaz qtrx awaf trxp'
      }
    },
    {
      command: 'cd client && npm run dev -- --port 5173',
      port: 5173,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
