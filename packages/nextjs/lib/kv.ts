import type { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk";
import { APP_NAME } from "~~/lib/constants";

// Simple in-memory storage for notification details
const localStore = new Map<string, MiniAppNotificationDetails>();

const keyFor = (fid: number): string => `${APP_NAME}:user:${fid}`;

export async function getUserNotificationDetails(fid: number): Promise<MiniAppNotificationDetails | null> {
  return localStore.get(keyFor(fid)) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails,
): Promise<void> {
  localStore.set(keyFor(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(fid: number): Promise<void> {
  localStore.delete(keyFor(fid));
}
