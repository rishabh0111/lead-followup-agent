import Link from "next/link";
import { REPS } from "@/lib/constants";
import { todayIST } from "@/lib/dates";
import { getLeads } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { classify, order } from "@/lib/lead-rules";
import { AppHeader } from "./components/AppHeader";
import { LeadList } from "./components/LeadList";
import { RepFilter } from "./components/RepFilter";

export const dynamic = "force-dynamic";

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  const raw = (await searchParams).rep;
  const rep = typeof raw === "string" && (REPS as readonly string[]).includes(raw) ? raw : "";
  const today = todayIST();
  const lists = order(await getLeads(rep || undefined), today);
  const overdue = lists.today.filter((l) => classify(l, today) === "overdue").length;

  return (
    <>
      <AppHeader>
        <RepFilter rep={rep} />
        <Link className="btn btn-primary" href="/leads/new">Add lead</Link>
      </AppHeader>
      <main>
        <div className="day">
          <h1>{formatDay(today)}</h1>
          <p className="count">
            <b>{lists.today.length === 0 ? "No one to contact today" : `${lists.today.length} to contact today`}</b>
            {overdue > 0 && <span className="od"> · {overdue} overdue</span>}
          </p>
        </div>

        <section aria-labelledby="h-today">
          <h2 className="section-head" id="h-today">Today</h2>
          {lists.today.length === 0
            ? <p className="empty">No one to contact today.</p>
            : <LeadList leads={lists.today} today={today} showRep={!rep} />}
        </section>

        {lists.later.length > 0 && (
          <section className="section-later" aria-labelledby="h-later">
            <h2 className="section-head" id="h-later">Later</h2>
            <LeadList leads={lists.later} today={today} showRep={!rep} />
          </section>
        )}
        <div className="list-end" />
      </main>
    </>
  );
}
