import { prisma } from "@/lib/db";

type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: string;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
