"use client";

import { useRouter } from "next/navigation";
import { REPS } from "@/lib/constants";

export function RepFilter({ rep }: { rep: string }) {
  const router = useRouter();
  return (
    <>
      <label className="visually-hidden" htmlFor="rep">Show leads for</label>
      <select
        className="rep-filter"
        id="rep"
        value={rep}
        onChange={(e) => {
          const v = e.target.value;
          router.push(v ? `/?rep=${encodeURIComponent(v)}` : "/");
        }}
      >
        <option value="">All reps</option>
        {REPS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </>
  );
}
