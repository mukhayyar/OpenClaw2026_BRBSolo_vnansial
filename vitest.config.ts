import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
    env: {
      SUMOPOD_API_KEY: '',
      YAHOO_MOCK: '1',
      NODE_ENV: 'test',
    },
  },
})
