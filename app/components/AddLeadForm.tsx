"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addLeadAction, type AddLeadState } from "@/app/actions";
import { REPS, SOURCES } from "@/lib/constants";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Adding and tagging…" : "Add lead"}
    </button>
  );
}

export function AddLeadForm({ today }: { today: string }) {
  const [state, action] = useActionState<AddLeadState, FormData>(addLeadAction, {});
  return (
    <form className="form" action={action}>
      {state.error && (
        <p className="alert full" role="alert"><b>Can&apos;t add this lead.</b> {state.error}</p>
      )}
      <div className="field">
        <label htmlFor="name">Buyer name</label>
        <input id="name" name="name" autoComplete="off" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" autoComplete="off" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input className="mono" id="phone" name="phone" type="tel" inputMode="tel" autoComplete="off" required maxLength={120} placeholder="+91 00000 00000" />
      </div>
      <div className="field">
        <label htmlFor="source">Source</label>
        <select id="source" name="source" required>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rep">Rep</label>
        <select id="rep" name="rep" required>
          {REPS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="product">Interested in <span className="opt">optional</span></label>
        <input id="product" name="productInterest" autoComplete="off" maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="last">Last contact date</label>
        <input id="last" name="lastContactDate" type="date" defaultValue={today} max={today} required />
      </div>
      <div className="field full">
        <label htmlFor="first">First message from buyer <span className="opt">optional</span></label>
        <textarea id="first" name="firstMessage" maxLength={2000} />
      </div>
      <div className="submit full">
        <Submit />
        <Link className="cancel" href="/">Cancel</Link>
      </div>
    </form>
  );
}
