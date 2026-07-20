"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MemberCover } from "@/lib/members";

/* Directory cover card — crisp Swiss, photo (or initials) + name + mono meta. */
function CoverCard({ member }: { member: MemberCover }) {
  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <Link
      href={`/m/${member.slug}`}
      className="group flex flex-col overflow-hidden rounded border border-hairline bg-surface transition-all duration-150 ease-[var(--ease-altus)] hover:-translate-y-0.5 hover:border-ink-muted"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-surface-sunk">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoUrl}
            alt={member.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-2xl text-ink-muted">{initials}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-lg font-semibold leading-tight text-ink">
          {member.fullName}
        </p>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          {[member.roleTitle, member.industry, member.city]
            .filter(Boolean)
            .join("  /  ")}
        </p>
        <p className="mt-3 line-clamp-2 text-[15px] leading-snug text-ink-secondary">
          {member.positioning}
        </p>
      </div>
    </Link>
  );
}

/* Border-only filter pill — selected = ink fill, paper text. */
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[14px] transition-colors duration-150 ${
        selected
          ? "border-ink bg-ink text-paper"
          : "border-hairline bg-surface-sunk text-ink-secondary hover:border-ink-muted"
      }`}
    >
      {label}
    </button>
  );
}

export default function ExploreGallery({ members }: { members: MemberCover[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const industries = useMemo(
    () => [...new Set(members.map((m) => m.industry))].sort(),
    [members],
  );
  const cities = useMemo(
    () => [...new Set(members.map((m) => m.city))].sort(),
    [members],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (industry && m.industry !== industry) return false;
      if (city && m.city !== city) return false;
      if (!q) return true;
      return [m.fullName, m.roleTitle, m.industry, m.city, m.positioning]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, industry, city]);

  const hasFilters = query.trim() || industry || city;

  return (
    <div>
      {/* Concierge search */}
      <div className="mt-10">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, industry, city…"
          className="w-full rounded border border-hairline bg-surface-sunk px-4 py-3.5 text-[17px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-red/40"
          aria-label="Search members"
        />
      </div>

      {/* Gentle filters */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">Industry</span>
          {industries.map((v) => (
            <FilterChip
              key={v}
              label={v}
              selected={industry === v}
              onClick={() => setIndustry(industry === v ? null : v)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">City</span>
          {cities.map((v) => (
            <FilterChip
              key={v}
              label={v}
              selected={city === v}
              onClick={() => setCity(city === v ? null : v)}
            />
          ))}
        </div>
      </div>

      {/* Result count + reset */}
      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
          {results.length} {results.length === 1 ? "member" : "members"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIndustry(null);
              setCity(null);
            }}
            className="text-[14px] text-red transition-colors hover:text-red-hover"
          >
            Clear
          </button>
        )}
      </div>

      {/* Gallery */}
      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-5 pb-24 md:grid-cols-3 lg:grid-cols-4">
          {results.map((m) => (
            <CoverCard key={m.slug} member={m} />
          ))}
        </div>
      ) : (
        <p className="mt-16 pb-24 text-center text-[17px] text-ink-secondary">
          No one matches that yet. Try a broader search.
        </p>
      )}
    </div>
  );
}
