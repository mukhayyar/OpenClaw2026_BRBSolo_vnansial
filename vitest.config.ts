import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
    env: {
      SUMOPOD_API_KEY: '',
      NODE_ENV: 'test',
    },
  },
})
