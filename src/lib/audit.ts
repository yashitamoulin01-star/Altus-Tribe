import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logError } from "@/lib/logger";

// Audit trail writer (Phase 6). Appends an immutable row attributed to the
// current session's user. Best-effort: never throws into the calling action,
// and no-ops safely offline/unmigrated. RLS enforces actor_id = auth.uid().
export interface AuditDetails {
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit(action: string, details: AuditDetails = {}): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) return;
    const user = await getUser();
    if (!user) return;

    const { error } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action,
      entity_type: details.entityType ?? null,
      entity_id: details.entityId ?? null,
      metadata: details.metadata ?? {},
    });
    if (error) logError("logAudit", error, { userId: user.id });
  } catch (err) {
    logError("logAudit", err);
  }
}
