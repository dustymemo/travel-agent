import { TripDetail } from "@/components/trips/TripDetail";

/**
 * A single saved trip, read-only (TA-54). Server Component shell; `params` is a
 * Promise in Next.js 16. The client {@link TripDetail} reads the row behind the
 * browser's anonymous session.
 */
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripDetail id={id} />;
}
