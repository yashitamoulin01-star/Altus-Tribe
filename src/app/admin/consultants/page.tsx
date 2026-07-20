import { getRoster } from "@/lib/admin";
import ConsultantManager from "./ConsultantManager";

export default async function AdminConsultantsPage() {
  const roster = await getRoster();

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Consultants</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Who tends the room.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-secondary">
        Consultants see the private CRM only for the members they&apos;re assigned to.
        Assign a designated consultant from a member&apos;s detail page.
      </p>

      <div className="mt-8">
        <ConsultantManager roster={roster} />
      </div>
    </main>
  );
}
