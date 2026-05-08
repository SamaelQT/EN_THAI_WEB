import { auth } from "@/lib/auth";
import { getReviewSets } from "@/services/review.service";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const sets = await getReviewSets();

  return <ReviewClient initialSets={sets as any} userId={uid} />;
}
