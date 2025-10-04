export interface RangeQuery {
  from?: string;
  to?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

function subtractRelative(base: Date, value: string): Date {
  const match = /^-P(\d+)([DWM])$/.exec(value);
  if (!match) {
    throw new Error(`Unsupported relative duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 'W' ? 7 : unit === 'M' ? 30 : 1;
  const ms = amount * multiplier * 24 * 60 * 60 * 1000;
  return new Date(base.getTime() - ms);
}

export function resolveRange(query: RangeQuery, fallbackDays = 7): DateRange {
  const now = new Date();
  const to = query.to ? parseDate(query.to) : now;
  const from = query.from
    ? (query.from.startsWith('-P') ? subtractRelative(to, query.from) : parseDate(query.from))
    : new Date(to.getTime() - fallbackDays * 24 * 60 * 60 * 1000);

  if (from.getTime() > to.getTime()) {
    throw new Error('`from` must be before `to`.');
  }

  return { from, to };
}
