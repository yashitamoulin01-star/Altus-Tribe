// Composition root. Selects the mock container (default, no infra) or the
// Supabase-backed container (once credentials exist). Server actions call
// getAccessContainer() / the service factories — never a concrete repo — so the
// swap is confined to this one file.

import type { AccessContainer } from "./ports";
import type { RateWindow } from "./logic";
import {
  mockAllowlistRepo,
  mockAuditRepo,
  mockAuthPort,
  mockImportRepo,
  mockRequestRepo,
  mockStoragePort,
} from "./mock/repositories";
import { AdminReviewService, RequestAccessService } from "./services";

// Flip to true (and provide the service-role client) once infra is ready. Reads
// an env flag so no code change is needed at deploy — see docs/17.
const USE_SUPABASE_ACCESS = process.env.USE_SUPABASE_ACCESS === "true";

function mockContainer(): AccessContainer {
  return {
    allowlist: mockAllowlistRepo,
    requests: mockRequestRepo,
    imports: mockImportRepo,
    audit: mockAuditRepo,
    auth: mockAuthPort,
    storage: mockStoragePort,
    now: () => Date.now(),
  };
}

export function getAccessContainer(): AccessContainer {
  if (USE_SUPABASE_ACCESS) {
    // When wiring: build the service-role client and the Supabase adapters here.
    // Intentionally not constructed yet — see docs/17-infrastructure-readiness.
    throw new Error(
      "USE_SUPABASE_ACCESS is set but the Supabase container is not wired. " +
        "Implement the adapters in adapters/supabase.ts and construct them here.",
    );
  }
  return mockContainer();
}

// Rate-window store. In-memory now (per-instance); swap for Redis/Upstash behind
// this same tiny interface for multi-instance deploys.
const rateStore = new Map<string, RateWindow>();
const rateAccess = {
  get: (k: string) => rateStore.get(k),
  set: (k: string, w: RateWindow) => void rateStore.set(k, w),
};

export function requestAccessService(): RequestAccessService {
  return new RequestAccessService(getAccessContainer(), rateAccess);
}

export function adminReviewService(): AdminReviewService {
  return new AdminReviewService(getAccessContainer());
}
