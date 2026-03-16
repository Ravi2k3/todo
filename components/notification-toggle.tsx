"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  subscribePush,
  unsubscribePush,
  sendTestNotification,
} from "@/lib/actions/notifications";
import { toast } from "sonner";

type NotificationState = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

const VAPID_PUBLIC_KEY: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationToggle() {
  const [state, setState] = useState<NotificationState>("loading");
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const checkSubscription = useCallback(async (): Promise<void> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setState("subscribed");
        setCurrentEndpoint(subscription.endpoint);
      } else {
        setState("unsubscribed");
        setCurrentEndpoint(null);
      }
    } catch {
      setState("unsubscribed");
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  function handleSubscribe(): void {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState("denied");
          toast.error("Notification permission denied");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const json = subscription.toJSON();
        await subscribePush({
          endpoint: json.endpoint!,
          keys: {
            p256dh: json.keys!["p256dh"]!,
            auth: json.keys!["auth"]!,
          },
        });

        setState("subscribed");
        setCurrentEndpoint(json.endpoint!);
        toast.success("Notifications enabled");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to subscribe";
        toast.error(message);
      }
    });
  }

  function handleUnsubscribe(): void {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribePush(subscription.endpoint);
        }

        setState("unsubscribed");
        setCurrentEndpoint(null);
        toast.success("Notifications disabled");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to unsubscribe";
        toast.error(message);
      }
    });
  }

  function handleTest(): void {
    if (!currentEndpoint) return;
    startTransition(async () => {
      const result = await sendTestNotification(currentEndpoint);
      if (result.success) {
        toast.success("Test notification sent");
      } else {
        toast.error(result.error ?? "Failed to send test notification");
      }
    });
  }

  if (state === "loading" || state === "unsupported") {
    return null;
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              {state === "subscribed" ? (
                <BellRing className="h-4 w-4" />
              ) : state === "denied" ? (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {state === "subscribed" && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {state === "subscribed"
                ? "Daily reminders for due & overdue tasks at 8:30 AM."
                : state === "denied"
                  ? "Notifications blocked by browser. Reset in site settings."
                  : "Get daily reminders for due & overdue tasks."}
            </p>
          </div>

          {state === "denied" ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              <BellOff className="mr-2 h-3.5 w-3.5" />
              Blocked by browser
            </Button>
          ) : state === "subscribed" ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleTest}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BellRing className="mr-2 h-3.5 w-3.5" />
                )}
                Send test notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleUnsubscribe}
                disabled={isPending}
              >
                Disable notifications
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={handleSubscribe}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="mr-2 h-3.5 w-3.5" />
              )}
              Enable notifications
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
