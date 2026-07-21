"use client";

import { useState, useTransition } from "react";
import { signOutOtherSessions, deleteAccount } from "./account-actions";

export default function AccountControls() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const signOutOthers = () =>
    start(async () => {
      setMsg("");
      const res = await signOutOtherSessions();
      setMsg(res.ok ? "Signed out of all other devices." : res.error ?? "Failed.");
    });

  const doDelete = () =>
    start(async () => {
      setMsg("");
      const res = await deleteAccount(); // redirects on success
      if (!res.ok) setMsg(res.error ?? "Could not delete account.");
    });

  const ghost =
    "rounded border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-40";

  return (
    <>
      {/* Sessions */}
      <div className="mt-10 border-t border-hairline pt-6">
        <p className="text-[16px] font-medium text-ink">Active sessions</p>
        <p className="mt-0.5 text-[14px] text-ink-muted">
          Signed in somewhere you don&apos;t recognise? Sign out everywhere except
          this device.
        </p>
        <button className={`${ghost} mt-4`} disabled={pending} onClick={signOutOthers}>
          {pending ? "Working…" : "Sign out other devices"}
        </button>
        {msg && <p className="mt-3 text-[13px] text-ink-secondary">{msg}</p>}
      </div>

      {/* Danger zone */}
      <div className="mt-10 rounded border border-red/30 bg-red/5 p-5">
        <p className="text-[16px] font-medium text-red">Delete account</p>
        <p className="mt-0.5 text-[14px] text-ink-secondary">
          Permanently removes your profile, feature, messages, and all data. This
          can&apos;t be undone.
        </p>
        {confirming ? (
          <div className="mt-4">
            <label className="block text-[13px] text-ink-secondary">
              Type <span className="font-mono text-ink">DELETE</span> to confirm:
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-48 rounded border border-hairline bg-white px-3 py-2 font-mono text-[14px] text-ink focus:border-red focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                className="rounded bg-red px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
                disabled={pending || confirmText !== "DELETE"}
                onClick={doDelete}
              >
                {pending ? "Deleting…" : "Delete my account"}
              </button>
              <button
                className={ghost}
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-4 rounded border border-red px-4 py-2 text-[14px] text-red transition-colors hover:bg-red hover:text-paper"
            onClick={() => setConfirming(true)}
          >
            Delete my account…
          </button>
        )}
      </div>
    </>
  );
}
