import type { MemberAddress } from "@/lib/members";

// One postal address as a card: stacked lines + city/state/pincode + map link.
export default function AddressCard({
  label,
  address,
}: {
  label: string;
  address: MemberAddress;
}) {
  const cityLine = [address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="rounded-lg border border-hairline p-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <div className="text-[15px] leading-relaxed text-ink-secondary">
        {address.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
        {cityLine && <p>{cityLine}</p>}
        {address.country && <p>{address.country}</p>}
      </div>
      {address.mapLink && (
        <a
          href={address.mapLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-[14px] text-red transition-colors hover:text-red-hover"
        >
          View on map →
        </a>
      )}
    </div>
  );
}
