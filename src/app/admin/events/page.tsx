import { getAllEvents } from "@/lib/events";
import EventManager from "./EventManager";

export const metadata = { title: "Events — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await getAllEvents();
  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Events</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        What&apos;s coming up.
      </h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-ink-secondary">
        Conclaves, referral rounds, orientations. Featured events pin to the top of
        the members&apos; home. Times are shown in your local timezone.
      </p>
      <EventManager initial={events} />
    </main>
  );
}
