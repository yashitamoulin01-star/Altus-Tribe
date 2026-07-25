"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MemberCover } from "@/lib/members";
import type { ConnectionState } from "@/lib/connections";
import ConnectButton from "@/components/ConnectButton";
import { useOnlineMembers } from "@/lib/presence";

const OPEN_TO_LABELS: Record<string, string> = {
  mentoring: "Mentoring",
  partnerships: "Partnerships",
  referrals: "Referrals",
  speaking: "Speaking",
  hiring: "Hiring",
};

/* Directory cover card. The photo + text is one link; the footer holds the
   Connect action (kept outside the link so it doesn't trigger navigation). */
function CoverCard({
  member,
  state,
  online = false,
}: {
  member: MemberCover;
  state: ConnectionState;
  online?: boolean;
}) {
  const initials = member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-all duration-200 hover:border-hairline-bright hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(0,0,0,0.28)]">
      <Link href={`/m/${member.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-sunk">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt={member.fullName}
              className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono text-2xl text-ink-muted">{initials}</span>
            </div>
          )}
          {member.locked && (
            <span
              className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white backdrop-blur-md"
              title="Private profile — connect to view"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Private
            </span>
          )}
          {online && !member.locked && (
            <span
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white backdrop-blur-md"
              title="Online now"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red shadow-[0_0_6px_var(--color-red)]" />
              Online
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[17px] font-semibold leading-tight text-ink transition-colors group-hover:text-red">
            {member.fullName}
          </p>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {[member.roleTitle, member.industry, member.city].filter(Boolean).join("  ·  ")}
          </p>
          {member.businessName && <p className="mt-2 text-[13px] text-ink-muted">{member.businessName}</p>}
          <p className="mt-3 line-clamp-2 text-[14px] leading-snug text-ink-secondary">{member.positioning}</p>
        </div>
      </Link>
      {state !== "self" && (
        <div className="px-4 pb-4">
          <ConnectButton profileId={member.id} initialState={state} />
        </div>
      )}
    </div>
  );
}

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
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-all duration-200 ${
        selected
          ? "border-red/40 bg-red-muted text-red"
          : "border-hairline bg-surface-sunk text-ink-secondary hover:border-hairline-bright hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function facet(members: MemberCover[], pick: (m: MemberCover) => string) {
  return [...new Set(members.map(pick).filter(Boolean))].sort();
}

/* A discovery strip (Recommended / Recently joined). Module-scoped so it isn't
   recreated each render. */
function Strip({
  title,
  items,
  stateFor,
  isOnline,
}: {
  title: string;
  items: MemberCover[];
  stateFor: (m: MemberCover) => ConnectionState;
  isOnline?: (m: MemberCover) => boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <p className="kicker mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {items.map((m) => (
          <CoverCard key={m.slug} member={m} state={stateFor(m)} online={isOnline?.(m)} />
        ))}
      </div>
    </section>
  );
}

export default function ExploreGallery({
  members,
  connectionMap,
  currentUserId,
  recommendedSlugs,
  initialQuery,
}: {
  members: MemberCover[];
  connectionMap: Record<string, ConnectionState>;
  currentUserId: string | null;
  recommendedSlugs: string[];
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [industry, setIndustry] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [openTo, setOpenTo] = useState<string | null>(null);

  const industries = useMemo(() => facet(members, (m) => m.industry), [members]);
  const categories = useMemo(() => facet(members, (m) => m.category), [members]);
  const cities = useMemo(() => facet(members, (m) => m.city), [members]);
  const openToOptions = useMemo(
    () => [...new Set(members.flatMap((m) => m.openTo))].sort(),
    [members],
  );

  const onlineIds = useOnlineMembers(currentUserId);
  const isOnline = (m: MemberCover) => m.id !== currentUserId && onlineIds.has(m.id);

  const stateFor = (m: MemberCover): ConnectionState =>
    m.id === currentUserId ? "self" : connectionMap[m.id] ?? "none";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (industry && m.industry !== industry) return false;
      if (category && m.category !== category) return false;
      if (city && m.city !== city) return false;
      if (openTo && !m.openTo.includes(openTo as MemberCover["openTo"][number])) return false;
      if (!q) return true;
      return [m.fullName, m.roleTitle, m.businessName, m.industry, m.category, m.city, m.interests, m.positioning]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, industry, category, city, openTo]);

  const hasFilters = Boolean(query.trim() || industry || category || city || openTo);
  const clearAll = () => {
    setQuery("");
    setIndustry(null);
    setCategory(null);
    setCity(null);
    setOpenTo(null);
  };

  // Discovery strips — only when browsing (no active search/filter).
  const featured = useMemo(
    () => (hasFilters ? [] : members.filter((m) => m.featured).slice(0, 8)),
    [members, hasFilters],
  );
  const recommended = useMemo(
    () => (hasFilters ? [] : members.filter((m) => recommendedSlugs.includes(m.slug)).slice(0, 8)),
    [members, recommendedSlugs, hasFilters],
  );
  const recentlyJoined = useMemo(() => {
    if (hasFilters) return [];
    return [...members]
      .filter((m) => m.createdAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [members, hasFilters]);
  const onlineNow = useMemo(
    () => (hasFilters ? [] : members.filter(isOnline).slice(0, 8)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, hasFilters, onlineIds],
  );

  return (
    <div>
      {/* Concierge search */}
      <div className="relative mt-10">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, business, industry, interest…"
          className="w-full rounded-xl border border-hairline bg-surface-sunk py-3.5 pl-12 pr-4 text-[16px] text-ink placeholder:text-ink-muted transition-all duration-200 focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
          aria-label="Search members"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 space-y-3">
        {industries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker mr-1">Industry</span>
            {industries.map((v) => (
              <FilterChip key={v} label={v} selected={industry === v} onClick={() => setIndustry(industry === v ? null : v)} />
            ))}
          </div>
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker mr-1">Category</span>
            {categories.map((v) => (
              <FilterChip key={v} label={v} selected={category === v} onClick={() => setCategory(category === v ? null : v)} />
            ))}
          </div>
        )}
        {cities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker mr-1">City</span>
            {cities.map((v) => (
              <FilterChip key={v} label={v} selected={city === v} onClick={() => setCity(city === v ? null : v)} />
            ))}
          </div>
        )}
        {openToOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker mr-1">Open to</span>
            {openToOptions.map((v) => (
              <FilterChip key={v} label={OPEN_TO_LABELS[v] ?? v} selected={openTo === v} onClick={() => setOpenTo(openTo === v ? null : v)} />
            ))}
          </div>
        )}
      </div>

      {/* Discovery strips (browsing only) */}
      <Strip title="Featured" items={featured} stateFor={stateFor} isOnline={isOnline} />
      <Strip title="Online now" items={onlineNow} stateFor={stateFor} isOnline={isOnline} />
      <Strip title="Recommended for you" items={recommended} stateFor={stateFor} isOnline={isOnline} />
      <Strip title="Recently joined" items={recentlyJoined} stateFor={stateFor} isOnline={isOnline} />

      {/* Result count + reset */}
      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
          {hasFilters ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : `${results.length} members`}
        </p>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="text-[14px] text-red transition-colors hover:text-red-hover">
            Clear
          </button>
        )}
      </div>

      {/* Directory */}
      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-5 pb-24 md:grid-cols-3 lg:grid-cols-4">
          {results.map((m) => (
            <CoverCard key={m.slug} member={m} state={stateFor(m)} online={isOnline(m)} />
          ))}
        </div>
      ) : (
        <div className="mt-16 pb-24 text-center">
          <p className="text-[17px] text-ink-secondary">No one matches that yet.</p>
          {hasFilters && (
            <button type="button" onClick={clearAll} className="mt-3 text-[14px] text-red transition-colors hover:text-red-hover">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
