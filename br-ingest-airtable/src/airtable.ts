import Airtable from 'airtable';
import { z } from 'zod';

const recSchema = z.object({
  id: z.string(),
  fields: z.object({
    Name: z.string().optional(),
    OwnerEmail: z.string().optional(),
    Status: z.string().optional(),
    CreatedAt: z.union([z.string(), z.date()]).optional()
  }),
  createdTime: z.string()
});

export type ATRecord = z.infer<typeof recSchema>;

export async function* fetchAirtableSince(sinceISO?: string, batchSize = 50) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(process.env.AIRTABLE_BASE_ID!);
  const table = base.table(process.env.AIRTABLE_TABLE || 'Projects');

  type SelectOpts = Airtable.SelectOptions<Record<string, unknown>> & { offset?: string };

  const params: SelectOpts = {
    pageSize: batchSize,
    sort: [{ field: 'CreatedAt', direction: 'asc' }],
    ...(sinceISO
      ? { filterByFormula: `IS_AFTER({CreatedAt}, DATETIME_PARSE("${sinceISO}", "YYYY-MM-DDTHH:mm:ssZ"))` }
      : {})
  };

  let offset: string | undefined;

  do {
    const page = await table.select({ ...params, offset } as SelectOpts).firstPage();
    if (!page.length) break;
    for (const r of page) {
      const parsed = recSchema.safeParse(r._rawJson);
      if (parsed.success) yield parsed.data;
    }
    offset = (page as any).offset;
  } while (offset);
}
