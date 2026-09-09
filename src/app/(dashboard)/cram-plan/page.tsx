import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listCramPlans } from "@/services/cram-plan.service";
import CramPlanClient from "./CramPlanClient";

export default async function CramPlanPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [plans, roadmap] = await Promise.all([
    listCramPlans(uid),
    prisma.roadmap.findFirst({
      where: { userId: uid, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { language: true, currentLevel: true },
    }),
  ]);

  return (
    <CramPlanClient
      initialPlans={plans as never}
      defaultLang={roadmap?.language ?? "english"}
      defaultLevel={roadmap?.currentLevel ?? "B1"}
    />
  );
}
