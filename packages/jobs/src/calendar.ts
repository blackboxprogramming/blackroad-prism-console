import type { CalendarItemRecord, CalendarStatus, ComplianceDb } from "@blackroad/compliance-db";
import { appendWorm } from "@blackroad/compliance-archival";

export interface U4Event {
  key: string;
  summary: string;
  changeDate: Date;
  riskFlags?: string[];
}

const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return result;
};

export const scheduleU4Amendment = async (
  db: ComplianceDb,
  event: U4Event
): Promise<CalendarItemRecord> => {
  const isSdRisk = (event.riskFlags ?? []).some((flag) => flag.toLowerCase().includes("sd"));
  const due = addBusinessDays(event.changeDate, isSdRisk ? 10 : 30);
  const record = await db.calendar.upsertByKey(event.key, {
    summary: event.summary,
    due,
    track: "onboarding",
    stateCode: undefined,
    status: "Open",
    blockers: [],
  });

  await appendWorm({
    db,
    payload: {
      type: "calendar",
      calendarId: record.id,
      key: event.key,
      due: due.toISOString(),
      riskFlags: event.riskFlags ?? [],
    },
  });

  return record;
};

export const setCalendarStatus = async (
  db: ComplianceDb,
  itemId: string,
  status: CalendarStatus,
  reason?: string
): Promise<CalendarItemRecord> => {
  if ((status === "Snoozed" || status === "Waived") && !reason) {
    throw new Error("Snoozed or waived items require a reason");
  }
  const record = await db.calendar.setStatus(itemId, status, reason);
  await appendWorm({
    db,
    payload: {
      type: "calendar_status",
      calendarId: record.id,
      status,
      reason,
    },
  });
  return record;
};
