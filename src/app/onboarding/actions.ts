"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingData } from "@/lib/onboarding-shared";

export type SaveResult = { ok: true } | { ok: false; error: string };

// Persists a partial onboarding patch for the signed-in member. Called on
// autosave (debounced) and on step changes. Writes profiles + businesses +
// expertise, all gated by RLS to the owner.
export async function saveOnboarding(
  patch: Partial<OnboardingData>,
  step: number,
): Promise<SaveResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "not-configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not-signed-in" };

  // profiles columns
  const profilePatch: Record<string, unknown> = { onboarding_step: step };
  if (patch.fullName !== undefined) profilePatch.full_name = patch.fullName.trim();
  if (patch.roleTitle !== undefined) profilePatch.role_title = patch.roleTitle.trim();
  if (patch.industry !== undefined) profilePatch.industry = patch.industry.trim();
  if (patch.city !== undefined) profilePatch.city = patch.city.trim();
  if (patch.positioning !== undefined)
    profilePatch.positioning = patch.positioning.trim();
  if (patch.knownFor !== undefined) profilePatch.known_for = patch.knownFor.trim();
  if (patch.about !== undefined) profilePatch.about = patch.about.trim();

  const { error: pErr } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id);
  if (pErr) return { ok: false, error: pErr.message };

  // business (1:1 upsert)
  if (patch.business !== undefined) {
    const b = patch.business;
    const { error: bErr } = await supabase.from("businesses").upsert({
      profile_id: user.id,
      name: b.name.trim() || null,
      description: b.description.trim() || null,
      website: b.website.trim() || null,
      team_size: b.teamSize.trim() || null,
      founded_year: b.foundedYear.trim() ? Number(b.foundedYear) : null,
    });
    if (bErr) return { ok: false, error: bErr.message };
  }

  // expertise (replace-all: simplest correct semantics for a small list)
  if (patch.expertise !== undefined) {
    const labels = patch.expertise.map((l) => l.trim()).filter(Boolean);
    const { error: delErr } = await supabase
      .from("expertise")
      .delete()
      .eq("profile_id", user.id);
    if (delErr) return { ok: false, error: delErr.message };
    if (labels.length) {
      const { error: insErr } = await supabase.from("expertise").insert(
        labels.map((label, i) => ({
          profile_id: user.id,
          label,
          sort_order: i,
        })),
      );
      if (insErr) return { ok: false, error: insErr.message };
    }
  }

  return { ok: true };
}

// Marks onboarding complete and sends the member to their finished feature.
export async function finishOnboarding(slug?: string): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }
  redirect(slug ? `/m/${slug}` : "/account");
}
