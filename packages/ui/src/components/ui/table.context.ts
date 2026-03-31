export const TableContext = {
  Table: `
USE THIS for ANY tabular/row-column data. NEVER use div+grid-cols to simulate a table.

Composition pattern (always follow this structure exactly):
  Table
  └── TableHeader
  │   └── TableRow
  │       └── TableHead (one per column)
  └── TableBody
      └── TableRow (one per data row)
          └── TableCell (one per column)

props:
  className?: string
  + all native <table> props

Complete example config:
{
  "component": "Table",
  "children": [
    {
      "component": "TableHeader",
      "children": [
        {
          "component": "TableRow",
          "children": [
            { "component": "TableHead", "children": ["Name"] },
            { "component": "TableHead", "children": ["Status"] },
            { "component": "TableHead", "children": ["Amount"] }
          ]
        }
      ]
    },
    {
      "component": "TableBody",
      "children": [
        {
          "component": "TableRow",
          "children": [
            { "component": "TableCell", "children": ["Alice"] },
            { "component": "TableCell", "children": [{ "component": "Badge", "children": ["Active"] }] },
            { "component": "TableCell", "children": ["$1,200"] }
          ]
        },
        {
          "component": "TableRow",
          "children": [
            { "component": "TableCell", "children": ["Bob"] },
            { "component": "TableCell", "children": [{ "component": "Badge", "props": { "variant": "secondary" }, "children": ["Inactive"] }] },
            { "component": "TableCell", "children": ["$950"] }
          ]
        }
      ]
    }
  ]
}
  `.trim(),
  TableHeader: `
Container for the header row of a Table. Always contains exactly one TableRow, which contains TableHead cells.

example config:
{
  "component": "TableHeader",
  "children": [
    {
      "component": "TableRow",
      "children": [
        { "component": "TableHead", "children": ["Name"] },
        { "component": "TableHead", "children": ["Email"] },
        { "component": "TableHead", "children": ["Role"] }
      ]
    }
  ]
}
  `.trim(),
  TableBody: `
Container for data rows of a Table. Contains one TableRow per data record, each with TableCell children.

example config:
{
  "component": "TableBody",
  "children": [
    {
      "component": "TableRow",
      "children": [
        { "component": "TableCell", "children": ["Alice"] },
        { "component": "TableCell", "children": ["alice@example.com"] },
        { "component": "TableCell", "children": ["Admin"] }
      ]
    }
  ]
}
  `.trim(),
  TableFooter: `
Optional footer row for a Table. Same structure as TableHeader (TableRow > TableCell).

example config:
{
  "component": "TableFooter",
  "children": [
    {
      "component": "TableRow",
      "children": [
        { "component": "TableCell", "props": { "colSpan": 2 }, "children": ["Total"] },
        { "component": "TableCell", "children": ["$2,150"] }
      ]
    }
  ]
}
  `.trim(),
  TableHead: `
A header cell inside a TableRow that is inside a TableHeader. One per column.

props:
  className?: string  — use this to control column width: "w-12", "w-32", "w-48", "w-64", "w-[200px]", "min-w-[120px]", "max-w-[300px]"
  + all native <th> props (colSpan, rowSpan, etc.)

NOTE: If a Figma design shows fixed column widths, translate them to className widths on TableHead — NEVER switch to div+grid just for column sizing.

example configs:
  { "component": "TableHead", "children": ["Name"] }
  { "component": "TableHead", "props": { "className": "w-12" }, "children": ["#"] }
  { "component": "TableHead", "props": { "className": "w-48" }, "children": ["Status"] }
  { "component": "TableHead", "props": { "className": "min-w-[200px]" }, "children": ["Description"] }
  `.trim(),
  TableRow: `
A row inside TableHeader, TableBody, or TableFooter. Contains TableHead (in header) or TableCell (in body/footer) children.

props:
  className?: string
  + all native <tr> props

example config (body row):
{
  "component": "TableRow",
  "children": [
    { "component": "TableCell", "children": ["INV-001"] },
    { "component": "TableCell", "children": ["$500"] }
  ]
}
  `.trim(),
  TableCell: `
A data cell inside a TableRow that is inside TableBody or TableFooter. One per column per row.

props:
  className?: string
  + all native <td> props (colSpan, rowSpan, etc.)

example config: { "component": "TableCell", "children": ["$1,200"] }
Can also contain components: { "component": "TableCell", "children": [{ "component": "Badge", "children": ["Paid"] }] }
  `.trim(),
  TableCaption: `
Optional caption for the Table, rendered below it.

example config: { "component": "TableCaption", "children": ["Invoice history for the last 3 months."] }
  `.trim(),
}

