function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  get databaseUrl(): string {
    return getRequiredEnv("DATABASE_URL");
  },
  get authPasswordHash(): string {
    return getRequiredEnv("AUTH_PASSWORD_HASH");
  },
  get sessionSecret(): string {
    return getRequiredEnv("SESSION_SECRET");
  },
} as const;
