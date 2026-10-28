import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { AddMessageForm } from "@/app/components/AddMessageForm";
import { AppHeader } from "@/app/components/AppHeader";
import { DraftEditor } from "@/app/components/DraftEditor";
import { TagBadge } from "@/app/components/TagBadge";
import { todayIST } from "@/lib/dates";
import { getLead } from "@/lib/db";
import { firstName, formatDay, messageDay, messageTime, urgencyLabel } from "@/lib/format";
import { classify } from "@/lib/lead-rules";

export const dynamic = "force-dynamic";

const URG_CLASS = { overdue: "is-overdue", today: "is-due", later: "is-later" } as const;

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const found = await getLead(id);
  if (!found) notFound();
  const { lead, messages } = found;
  const today = todayIST();
  const urgency = classify(lead, today);
  const label = urgencyLabel(lead.followUpDate, today);
  const urgText = urgency === "later" ? `Next: ${label}` : `${label} · ${formatDay(lead.followUpDate)}`;
  const sentDay = lead.draftSentAt ? messageDay(lead.draftSentAt) : null;
  const sentLabel = sentDay ? (sentDay === today ? "today" : formatDay(sentDay)) : null;

  return (
    <>
      <AppHeader>
        <Link className="btn btn-primary" href="/leads/new">Add lead</Link>
      </AppHeader>
      <main>
        <p className="crumb"><Link href="/">‹ Today list</Link></p>
        <div className="lead-head">
          <h1>{lead.name}</h1>
          <p className="company">{lead.company}</p>
          <dl className="facts">
            <div><dt>Phone</dt><dd><a className="mono" href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a></dd></div>
            <div><dt>Source</dt><dd>{lead.source}</dd></div>
            <div><dt>Rep</dt><dd>{lead.rep}</dd></div>
            <div><dt>Interested in</dt><dd>{lead.productInterest ?? "Not stated"}</dd></div>
          </dl>
        </div>

        <div className="detail">
          <section className="chat-col" aria-labelledby="h-chat">
            <h2 className="visually-hidden" id="h-chat">Chat</h2>
            {messages.length === 0 ? (
              <p className="chat-empty">No messages yet.</p>
            ) : (
              <ol className="chat">
                {messages.map((m, i) => {
                  const day = messageDay(m.sentAt);
                  const newDay = i === 0 || messageDay(messages[i - 1].sentAt) !== day;
                  return (
                    <Fragment key={m.id ?? i}>
                      {newDay && <li className="day-sep">{day === today ? "Today" : formatDay(day)}</li>}
                      <li className={`msg ${m.sender}`}>
                        <span className="meta">
                          {m.sender === "rep" ? firstName(m.senderName) : m.senderName}
                          <time dateTime={m.sentAt}>{messageTime(m.sentAt)}</time>
                        </span>
                        <span className="text">{m.text}</span>
                      </li>
                    </Fragment>
                  );
                })}
              </ol>
            )}
            <AddMessageForm id={lead.id} />
          </section>

          <aside className="side" aria-label="Tag and draft">
            <div className="assess">
              <div className="status">
                <TagBadge tag={lead.tag} />
                <span className={`urg ${URG_CLASS[urgency]}`}>{urgText}</span>
              </div>
              <p className="reason">{lead.reason}</p>
              {lead.agentUnavailable && <p className="notice">Agent unavailable, showing the last assessment</p>}
              {lead.assessedBy === "rules" && <p className="notice">Tagged by rules</p>}
            </div>
            <DraftEditor
              id={lead.id}
              buyerFirstName={firstName(lead.name)}
              draft={lead.draft}
              sentLabel={sentLabel}
            />
          </aside>
        </div>
      </main>
    </>
  );
}
