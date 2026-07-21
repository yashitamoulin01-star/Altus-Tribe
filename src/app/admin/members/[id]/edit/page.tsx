import { notFound, redirect } from "next/navigation";
import { loadEditable, getTaxonomies } from "@/lib/profile-edit";
import { getAdminContext, getRosterMember } from "@/lib/admin";
import { isAuthConfigured } from "@/lib/auth";
import { emptyEditable } from "@/lib/profile-fields";
import EditFeature from "@/app/(app)/account/edit/EditFeature";

export const metadata = { title: "Edit member — Altus Tribe" };

// P3: admin edits another member's full profile. Reuses the member composer with
// an admin target; loadEditable/saveProfile authorize the admin server-side and
// RLS ("admins manage profiles") is the real boundary.
export default async function AdminEditMemberPage({
  params,
}: PageProps<"/admin/members/[id]/edit">) {
  const { id } = await params;
  const ctx = await getAdminContext();
  // Only admins may edit profiles (consultants manage the CRM, not the profile).
  if (ctx.configured && !ctx.isAdmin) redirect(`/admin/members/${id}`);

  const configured = isAuthConfigured();
  const [state, taxonomies, member] = await Promise.all([
    loadEditable(id),
    getTaxonomies(),
    getRosterMember(id),
  ]);
  if (configured && !member) notFound();

  return (
    <EditFeature
      initial={state?.data ?? emptyEditable}
      initialVisibility={state?.visibility ?? {}}
      slug={state?.slug ?? member?.slug ?? null}
      userId={state?.userId ?? id}
      industries={taxonomies.industry}
      categories={taxonomies.category}
      configured={configured}
      adminTargetId={id}
      backHref={`/admin/members/${id}`}
      backLabel="Member"
      editingName={member?.fullName}
    />
  );
}
