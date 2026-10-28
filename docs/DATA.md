# Sample data

All data is made up. Check that no name or phone number belongs to a real person or business.

## Leads: `data/leads.xlsx`

Kept as Excel, since that's where the business keeps its leads today. Load it into the app's store
when the app first starts.

| Column | Required | Notes |
| --- | --- | --- |
| `lead_id` | yes | e.g. L001 |
| `name` | yes | Buyer's name |
| `company` | yes | A business that buys packaging equipment: food, pharma, FMCG, e-commerce, and so on |
| `phone` | yes | Made up; mark it clearly as fake |
| `source` | yes | e.g. IndiaMART, trade show, website form, referral, cold call, WhatsApp |
| `last_contact_date` | yes | Dates relative to the demo date, so overdue items always show |
| `rep` | added | One of the 5 reps, so each rep has their own list |
| `product_interest` | added | e.g. carton sealer, shrink wrapper, strapping machine, form-fill-seal |

At least 20 rows. Spread the `last_contact_date` values: some today, some overdue, some in the
future, and some old enough to be cold.

## Chats: `data/chats/<lead_id>.txt`

At least 10 chats, each 4-12 lines, in WhatsApp export style:

```
[12/10/26, 10:14] Rep (Amit): Hi Priya, sharing the quote for the 2 carton sealers.
[12/10/26, 11:02] Priya Nair: Thanks. Can you do delivery before Diwali?
```

The chats need to cover every case the agent should handle:
- **Hot**: asked for a quote or price, gave a date, said "send PI", or asked about delivery or
  payment terms.
- **Warm**: interested but no timeline, "will discuss internally", or asked for a brochure or video.
- **Cold**: no reply to the last 2 messages, "not now, next quarter", or a budget freeze.
- A buyer who asked the rep to call on a specific date, so the next follow-up must match it.
- An objection (price, or comparing with a competitor) that the draft has to answer.
- Hinglish or a casual tone in at least a couple of chats, to match real Indian B2B WhatsApp.

Leads with no chat get tagged from their fields alone (source, how long since last contact).
