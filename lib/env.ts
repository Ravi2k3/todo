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
  get sessionSecret(): string {
    return getRequiredEnv("SESSION_SECRET");
  },
  get vapidPublicKey(): string {
    return getRequiredEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  },
  get vapidPrivateKey(): string {
    return getRequiredEnv("VAPID_PRIVATE_KEY");
  },
} as const;
