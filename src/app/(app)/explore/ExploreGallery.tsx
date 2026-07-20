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
        {member.businessName && (
          <p className="mt-2 text-[13px] text-ink-muted">{member.businessName}</p>
        )}
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

// Distinct, sorted, non-empty values for a facet across the member set.
function facet(members: MemberCover[], pick: (m: MemberCover) => string) {
  return [...new Set(members.map(pick).filter(Boolean))].sort();
}

export default function ExploreGallery({ members }: { members: MemberCover[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  // Distinct, sorted facet values — only render a filter row if it has options.
  const industries = useMemo(() => facet(members, (m) => m.industry), [members]);
  const categories = useMemo(() => facet(members, (m) => m.category), [members]);
  const cities = useMemo(() => facet(members, (m) => m.city), [members]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (industry && m.industry !== industry) return false;
      if (category && m.category !== category) return false;
      if (city && m.city !== city) return false;
      if (!q) return true;
      // Search across member, business/company, industry, category, location,
      // and interests (#157–163).
      return [
        m.fullName,
        m.roleTitle,
        m.businessName,
        m.industry,
        m.category,
        m.city,
        m.interests,
        m.positioning,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, industry, category, city]);

  const hasFilters = Boolean(query.trim() || industry || category || city);
  const clearAll = () => {
    setQuery("");
    setIndustry(null);
    setCategory(null);
    setCity(null);
  };

  return (
    <div>
      {/* Concierge search */}
      <div className="mt-10">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, business, industry, interest…"
          className="w-full rounded border border-hairline bg-surface-sunk px-4 py-3.5 text-[17px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-red/40"
          aria-label="Search members by name, business, industry, category, location, or interest"
        />
      </div>

      {/* Gentle filters — a row only appears when it has values */}
      <div className="mt-6 space-y-3">
        {industries.length > 0 && (
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
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker mr-1">Category</span>
            {categories.map((v) => (
              <FilterChip
                key={v}
                label={v}
                selected={category === v}
                onClick={() => setCategory(category === v ? null : v)}
              />
            ))}
          </div>
        )}
        {cities.length > 0 && (
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
        )}
      </div>

      {/* Result count + reset */}
      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
          {results.length} {results.length === 1 ? "member" : "members"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
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
        <div className="mt-16 pb-24 text-center">
          <p className="text-[17px] text-ink-secondary">
            No one matches that yet.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 text-[14px] text-red transition-colors hover:text-red-hover"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
