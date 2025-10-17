export async function postSlackMessage(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("[pd] failed to post slack message", err);
  }
}
