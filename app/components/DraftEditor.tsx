"use client";

import { useFormStatus } from "react-dom";
import { markSentAction, saveDraftAction } from "@/app/actions";

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="actions">
      <button className="btn btn-secondary" type="submit" formAction={saveDraftAction} disabled={pending}>Save</button>
      <button className="btn btn-primary" type="submit" formAction={markSentAction} disabled={pending}>Mark as sent</button>
    </div>
  );
}

export function DraftEditor({ id, buyerFirstName, draft, sentLabel }: {
  id: string;
  buyerFirstName: string;
  draft: string | null;
  sentLabel: string | null;
}) {
  if (draft === null) {
    return (
      <div className="draft">
        <h2>Draft to {buyerFirstName}</h2>
        {sentLabel && <p className="sent">Sent {sentLabel} ✓</p>}
      </div>
    );
  }
  return (
    <form className="draft">
      <h2><label htmlFor="draft-text">Draft to {buyerFirstName}</label></h2>
      <input type="hidden" name="id" value={id} />
      <textarea key={draft} id="draft-text" name="draft" defaultValue={draft} maxLength={2000} required />
      <Buttons />
    </form>
  );
}
