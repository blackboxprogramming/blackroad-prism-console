import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import archiver from 'archiver';
import type { PrismaClient } from '@blackroad/db';

export interface AuditExportOptions {
  accountId: string;
  from: Date;
  to: Date;
  outputPath: string;
}

export class AuditExporter {
  constructor(private readonly prisma: PrismaClient) {}

  async export({ accountId, from, to, outputPath }: AuditExportOptions): Promise<string> {
    await fs.mkdir(dirname(outputPath), { recursive: true });
    const output = (await import('fs')).createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    const documents = await this.prisma.document.findMany({
      where: {
        accountId,
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });

    for (const document of documents) {
      try {
        archive.file(document.path, { name: join('documents', document.path.split('/').pop() ?? document.id) });
      } catch (err) {
        archive.append(`Missing file ${document.path}: ${(err as Error).message}`, {
          name: join('documents', `${document.id}_missing.txt`)
        });
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId, tradeDate: { gte: from, lte: to } },
      orderBy: { tradeDate: 'asc' }
    });
    archive.append(JSON.stringify(transactions, null, 2), { name: 'transactions.json' });

    const breaks = await this.prisma.reconBreak.findMany({
      where: { accountId, asOf: { gte: from, lte: to } }
    });
    archive.append(JSON.stringify(breaks, null, 2), { name: 'recon_breaks.json' });

    const wormBlocks = await this.prisma.wormBlock.findMany({ orderBy: { idx: 'asc' } });
    archive.append(JSON.stringify(wormBlocks, null, 2), { name: 'worm_chain.json' });

    await archive.finalize();
    return outputPath;
  }
}
