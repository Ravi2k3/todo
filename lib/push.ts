import webpush from "web-push";
import { env } from "@/lib/env";

const VAPID_CONTACT_EMAIL = "ravi@tasks.app";

webpush.setVapidDetails(
  `mailto:${VAPID_CONTACT_EMAIL}`,
  env.vapidPublicKey,
  env.vapidPrivateKey,
);

export { webpush };
