"use client";

import { useFormStatus } from "react-dom";
import { addMessageAction } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-secondary" type="submit" disabled={pending}>
      {pending ? "Updating lead…" : "Add message"}
    </button>
  );
}

export function AddMessageForm({ id }: { id: string }) {
  return (
    <form className="add-msg" action={addMessageAction}>
      <input type="hidden" name="id" value={id} />
      <fieldset className="from">
        <legend>Add a message from</legend>
        <div className="seg">
          <input type="radio" name="sender" id="from-rep" value="rep" />
          <label htmlFor="from-rep">Rep</label>
          <input type="radio" name="sender" id="from-buyer" value="buyer" defaultChecked />
          <label htmlFor="from-buyer">Buyer</label>
        </div>
      </fieldset>
      <label className="visually-hidden" htmlFor="msg-text">Message</label>
      <textarea id="msg-text" name="text" rows={2} placeholder="Type or paste one message" maxLength={2000} required />
      <Submit />
    </form>
  );
}
