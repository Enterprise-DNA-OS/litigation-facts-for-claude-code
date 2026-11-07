# Move a Casefleet chronology

Sources reopened 7 November 2026: [Facts and reports](https://support.casefleet.com/en/articles/2013230-exporting-facts-and-running-reports) and [Exporting your data](https://support.casefleet.com/en/articles/1944257-exporting-your-data).

1. In the case's Reports tab, select Fact Spreadsheet. Remove filters and include undated facts when you want the whole chronology. Generate and download the Excel report.
2. Separately retain the Case Archive Bundle and original source documents. The raw account export is not the source-document backup. Keep originals in your restricted evidence store.
3. Create the destination matter with add-matter. Run `npm run facts -- import casefleet --matter=CASE01 --file=imports/facts.xlsx --actor="Your name" --dry-run`. Inspect the row count, then repeat without --dry-run.
4. Compare the chronology, dates, undated facts and original fields. Link issues, witnesses and evidence references after reviewing their meaning. Reconcile conflicting accounts before relying on a draft.
5. Run both systems until the agreed records and original documents reconcile. Keep the archive before cancelling anything.

## Mapping

The vendor documents the report's content but not a fixed header contract. The reader accepts .xlsx and UTF-8 .csv. Put headers in row 1. Use --sheet="Facts" when there are multiple worksheets. Supported aliases:

| Destination | Accepted column names |
|---|---|
| Fact text | Fact, Fact Text, Description, Text |
| Calendar date | Date, Fact Date, Start Date |
| Stable source ID | Fact ID, ID, Id |
| Original record | Every original column is preserved in source_data |

For different headers, supply `--map=fixtures/field-map.json` with your exact names, for example `{"fact":"Description","date":"Event Date","id":"Reference"}`. An absent optional date or ID is accepted; fact text is required. Dates must be Excel date cells or ISO YYYY-MM-DD text. A locale date such as 03/04/2026 is rejected. Preserve date ranges and approximate dates in their original fields, then review and set date precision; never silently turn them into exact dates. Formula cells are rejected; use a values-only copy.

Entity, issue, source, comments and other columns stay with the raw fact. The importer does not guess how a combined source description splits into citations or how a witness name resolves. Use add-source, add-issue, add-witness, cite and link commands for reviewed mapping. Attachments, highlights, document content, court deadlines, user permissions and historical reviews do not become linked records automatically. Enterprise DNA handles the agreed mapping in a customised installation.

Rows with a stable source ID update only with --update. Identical imports are unchanged. Without IDs, the entire original row is its identity: a changed row is new, so reconcile before accepting both. Duplicate identical rows without IDs collapse to one. All writes and audit records roll back if any row fails, including dry runs.

The fixture is synthetic. No authenticated Casefleet workbook was available in this run. Test one actual export and adjust the header map before a full migration. The one-command import promise covers the fact spreadsheet and retained raw fields, not a complete automatic migration of the service.
