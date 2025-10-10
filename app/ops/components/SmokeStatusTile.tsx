"use client";

import useSWR from "swr";
import { useMemo, type CSSProperties } from "react";

type SmokeStatus = {
  ok: boolean;
  at?: string;
  pd?: string;
  jira?: string;
};

const fetcher = async (url: string): Promise<SmokeStatus> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch smoke status");
  }
  return response.json();
};

const jiraBase =
  process.env.NEXT_PUBLIC_JIRA_BASE ??
  process.env.NEXT_PUBLIC_JIRA_URL ??
  "";

const boxStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  backgroundColor: "#ffffff",
  boxShadow: "0 5px 15px rgba(15, 23, 42, 0.05)",
  minWidth: "240px",
  maxWidth: "320px",
};

const titleStyle: CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 600,
  marginBottom: "0.5rem",
};

const labelStyle: CSSProperties = {
  fontSize: "0.9rem",
  marginBottom: "0.25rem",
};

const metaStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
};

export default function SmokeStatusTile() {
  const { data, error } = useSWR<SmokeStatus>("/api/smoke/status", fetcher, {
    refreshInterval: 60_000,
  });

  const status = data ?? { ok: true };

  const displayTime = useMemo(() => {
    if (!status.at) {
      return "—";
    }
    const date = new Date(status.at);
    if (Number.isNaN(date.getTime())) {
      return status.at;
    }
    return date.toLocaleString();
  }, [status.at]);

  const pdLink = status.pd ? status.pd : "";
  const jiraLink = useMemo(() => {
    if (!status.jira) {
      return "";
    }
    if (jiraBase) {
      const base = jiraBase.endsWith("/") ? jiraBase.slice(0, -1) : jiraBase;
      return `${base}/browse/${status.jira}`;
    }
    return status.jira;
  }, [status.jira]);

  const lines: string[] = [];
  if (!status.ok) {
    lines.push("❌ Last run failed — check PagerDuty + logs");
  } else if (!status.jira) {
    lines.push("⚠️ Jira linkage pending — no page was sent");
  }
  if (error) {
    lines.push("⚠️ Unable to refresh status");
  }

  return (
    <section style={boxStyle}>
      <div style={titleStyle}>Daily Smoke</div>
      <div style={labelStyle}>Status: {status.ok ? "✅ Pass" : "❌ Fail"}</div>
      <div style={labelStyle}>When: {displayTime}</div>
      <div style={metaStyle}>Updates every minute</div>
      {pdLink && (
        <div style={labelStyle}>
          <a href={pdLink} target="_blank" rel="noreferrer">
            PagerDuty
          </a>
        </div>
      )}
      {jiraLink && (
        <div style={labelStyle}>
          <a href={jiraLink} target="_blank" rel="noreferrer">
            Jira
          </a>
        </div>
      )}
      {lines.length > 0 && (
        <div style={{ ...metaStyle, marginTop: "0.5rem", whiteSpace: "pre-line" }}>
          {lines.join("\n")}
        </div>
      )}
    </section>
  );
}
