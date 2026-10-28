/*
 * Generates data/leads.xlsx, the stand-in for the business's Excel file.
 * Run: npx tsx scripts/make-leads-xlsx.ts
 *
 * Everything here is invented. Phones use +91 00000 000NN (not a real prefix).
 * Written as if today were DATA_DATE (2026-10-28).
 *
 * Each lead is scheduled as schedule(intendedTag, requestedDate, lastContact):
 * Hot +0, Warm +3, Cold +10 days, or the requested date if there is one.
 * No-chat leads are assessed as of their own last contact (0 days), so they
 * come out Warm.
 *
 * ID    tag   case                                      last        requested   follow-up
 * L001  Hot   asks for quote; delivery and payment terms 2026-10-28  -           2026-10-28
 * L002  Hot   says "send PI" (Hinglish)                  2026-10-28  -           2026-10-28
 * L003  Warm  no chat (WhatsApp, 0 days)                 2026-10-28  -           2026-10-31
 * L004  Warm  asks for brochure and video; no timeline   2026-10-28  -           2026-10-31
 * L005  Warm  "will discuss internally"                  2026-10-25  -           2026-10-28
 * L006  Warm  no chat (Website form, 3 days)             2026-10-25  -           2026-10-28
 * L007  Warm  MAIN-FLOW lead: no buying signal, recent   2026-10-27  -           2026-10-30
 * L008  Warm  no chat (Referral, 2 days)                 2026-10-26  -           2026-10-29
 * L009  Cold  "not now, next quarter"; budget used up    2026-10-24  -           2026-11-03
 * L010  Warm  no chat (Referral, 1 day)                  2026-10-27  -           2026-10-30
 * L011  Cold  no reply to last 2 rep messages (Hinglish) 2026-10-20  -           2026-10-30
 * L012  Cold  budget freeze                              2026-10-22  -           2026-11-01
 * L013  Warm  no chat (IndiaMART, 2 days)                 2026-10-26  -           2026-10-29
 * L014  Warm  no chat (Cold call, 2 days)                2026-10-26  -           2026-10-29
 * L015  Warm  "call me on 29 Oct" (Hinglish)             2026-10-23  2026-10-29  2026-10-29
 * L016  Warm  no chat (IndiaMART, 3 days)                2026-10-25  -           2026-10-28
 * L017  Warm  price too high; compares with SealRite     2026-10-09  -           2026-10-12
 * L018  Hot   quote sent; "we decide by 5 Nov"           2026-10-14  -           2026-10-14
 * L019  Warm  "call me on 3 Nov"                         2026-10-13  2026-11-03  2026-11-03
 * L020  Warm  interested, no timeline                    2026-10-03  -           2026-10-06
 * L021  Warm  no chat (Trade show)                       2026-09-20  -           2026-09-23
 * L022  Warm  no chat (Cold call)                        2026-09-30  -           2026-10-03
 *
 * Load day (2026-10-28), from the table above:
 *   Overdue (follow-up before 28 Oct): L017, L018, L020, L021, L022 = 5
 *   Due today (follow-up on 28 Oct):   L001, L002, L005, L006, L016 = 5
 *   The main-flow lead L007 is due 30 Oct, so it is not on the Today list.
 *   Adding a quote request makes it Hot (+0 from its new contact date).
 *
 * Case index: Hot quote L001; send PI L002; terms L001; decision date L018;
 * Warm internal discussion L005; brochure or video L004; no timeline L004,
 * L020; Cold no reply L011; next quarter L009; budget freeze L012; call-on-date
 * L015, L019; objection L017; Hinglish L002, L011, L015.
 */
import ExcelJS from "exceljs";
import { DATA_DATE, REPS, SOURCES } from "../lib/constants";

type Row = [id: string, name: string, company: string, source: (typeof SOURCES)[number], last: string, rep: number, product: string];

const ROWS: Row[] = [
  ["L001", "Dhruv Malhotra", "Brightleaf Snacks", "Trade show", "2026-10-28", 0, "carton sealer"],
  ["L002", "Kavita Joshi", "Sundrop Dairy Products", "Referral", "2026-10-28", 1, "case erector"],
  ["L003", "Manish Ahuja", "Zestora Beverages", "WhatsApp", "2026-10-28", 2, "shrink wrapper"],
  ["L004", "Pooja Bansal", "Nimbus Pharma Labs", "Website form", "2026-10-28", 3, "labelling machine"],
  ["L005", "Rohit Chandra", "Veloura Spices", "IndiaMART", "2026-10-25", 4, "strapping machine"],
  ["L006", "Anita Deshpande", "Cartly Online Retail", "Website form", "2026-10-25", 0, "carton sealer"],
  ["L007", "Sameer Qureshi", "Aaromax Foods", "Website form", "2026-10-27", 1, "form-fill-seal"],
  ["L008", "Tanvi Kulkarni", "Boltwave E-commerce", "Referral", "2026-10-26", 2, "case erector"],
  ["L009", "Farhan Ansari", "Medora Healthcare", "Trade show", "2026-10-24", 3, "labelling machine"],
  ["L010", "Gaurav Pillai", "Dalmera Dairy", "Referral", "2026-10-27", 4, "strapping machine"],
  ["L011", "Ritu Saxena", "Crispo Namkeen", "IndiaMART", "2026-10-20", 0, "shrink wrapper"],
  ["L012", "Harsh Vora", "Lumina Nutraceuticals", "Cold call", "2026-10-22", 1, "labelling machine"],
  ["L013", "Deepak Naidu", "Freshgrain Foods", "IndiaMART", "2026-10-26", 2, "form-fill-seal"],
  ["L014", "Shalini Menon", "Orbit Parcel Co", "Cold call", "2026-10-26", 3, "strapping machine"],
  ["L015", "Arjun Bhatt", "Gulmohar Frozen Foods", "Referral", "2026-10-23", 4, "case erector"],
  ["L016", "Nisha Rawat", "Pureleaf Tea Co", "IndiaMART", "2026-10-25", 0, "carton sealer"],
  ["L017", "Vivek Agarwal", "Tastora Biscuits", "Trade show", "2026-10-09", 1, "shrink wrapper"],
  ["L018", "Meera Iyer", "Quickcart Retail", "WhatsApp", "2026-10-14", 2, "carton sealer"],
  ["L019", "Sanjay Khanna", "Healwell Pharma", "Website form", "2026-10-13", 3, "form-fill-seal"],
  ["L020", "Pallavi Sinha", "Amulya Milk Foods", "IndiaMART", "2026-10-03", 4, "strapping machine"],
  ["L021", "Kunal Thakur", "Zippy Pack Foods", "Trade show", "2026-09-20", 0, "case erector"],
  ["L022", "Rekha Nambiar", "Vitalis Wellness", "Cold call", "2026-09-30", 1, "labelling machine"],
];

const HEADER = ["lead_id", "name", "company", "phone", "source", "last_contact_date", "rep", "product_interest"];

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Leads");
  ws.addRow(HEADER);
  ROWS.forEach(([id, name, company, source, last, rep, product], i) => {
    const phone = `+91 00000 000${String(i + 1).padStart(2, "0")}`;
    ws.addRow([id, name, company, phone, source, last, REPS[rep], product]);
  });
  ws.columns.forEach((c) => (c.width = 22));
  await wb.xlsx.writeFile("data/leads.xlsx");
  console.log(`${ROWS.length} leads (data date ${DATA_DATE})`);
}

main();
