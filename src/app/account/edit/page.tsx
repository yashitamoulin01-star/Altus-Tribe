import { loadEditable, getTaxonomies } from "@/lib/profile-edit";
import { isAuthConfigured } from "@/lib/auth";
import { emptyEditable } from "@/lib/profile-fields";
import EditFeature from "./EditFeature";

export const metadata = { title: "Edit feature — Altus Tribe" };

export default async function EditPage() {
  const configured = isAuthConfigured();
  const [state, taxonomies] = await Promise.all([loadEditable(), getTaxonomies()]);

  return (
    <EditFeature
      initial={state?.data ?? emptyEditable}
      initialVisibility={state?.visibility ?? {}}
      slug={state?.slug ?? null}
      industries={taxonomies.industry}
      categories={taxonomies.category}
      configured={configured}
    />
  );
}
