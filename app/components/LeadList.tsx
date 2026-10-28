import Link from "next/link";
import { firstName, urgencyLabel } from "@/lib/format";
import { classify } from "@/lib/lead-rules";
import type { Lead } from "@/lib/types";
import { TagBadge } from "./TagBadge";

const ROW_CLASS = { overdue: "is-overdue", today: "is-due", later: "is-later" } as const;

export function LeadList({ leads, today, showRep }: { leads: Lead[]; today: string; showRep: boolean }) {
  return (
    <ul className="rows">
      {leads.map((lead) => {
        const rep = firstName(lead.rep);
        return (
          <li key={lead.id} className={`row ${ROW_CLASS[classify(lead, today)]}`}>
            <span className="urg">{urgencyLabel(lead.followUpDate, today)}</span>
            <span className="who">
              <Link href={`/leads/${lead.id}`}>{lead.name}</Link>
              <span className="company">
                {lead.company}
                {showRep && <span className="rep-inline"> · {rep}</span>}
              </span>
            </span>
            <TagBadge tag={lead.tag} />
            <p className="reason" title={lead.reason}>{lead.reason}</p>
            <span className="rep">{showRep ? rep : ""}</span>
            <span className="chev" aria-hidden="true">›</span>
          </li>
        );
      })}
    </ul>
  );
}
