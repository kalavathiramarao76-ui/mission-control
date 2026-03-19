import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json();
  const apiKey = process.env.AGENTMAIL_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "AGENTMAIL_API_KEY not set" }, { status: 500 });
  if (!to || !subject) return NextResponse.json({ error: "to and subject are required" }, { status: 400 });

  const res = await fetch(
    "https://api.agentmail.to/v0/inboxes/saikiran%40agentmail.to/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [to],
        subject,
        text: body,
        html: `<div style="font-family:sans-serif;line-height:1.6">${body.replace(/\n/g, "<br/>")}</div>`,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, messageId: data.message_id });
}
