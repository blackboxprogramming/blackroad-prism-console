export interface RetentionPolicy {
  years: number;
  legalHold: boolean;
}

export const defaultRetentionPolicy: RetentionPolicy = {
  years: Number(process.env.BOOKS_RETENTION_YEARS ?? 7),
  legalHold: process.env.BOOKS_LEGAL_HOLD === 'true'
};
