import Link from "next/link";
import { AddLeadForm } from "@/app/components/AddLeadForm";
import { AppHeader } from "@/app/components/AppHeader";
import { todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function NewLeadPage() {
  return (
    <>
      <AppHeader />
      <main>
        <p className="crumb"><Link href="/">‹ Today list</Link></p>
        <h1 className="page-title">New lead</h1>
        <AddLeadForm today={todayIST()} />
      </main>
    </>
  );
}
