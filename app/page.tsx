"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
type Agent = {
  id: string;
  name: string;
  emoji: string;
  status: "online" | "offline" | "busy";
  role: string;
  uptime: string;
  lastAction: string;
  stats: { tasks: number; repos: number; deploys: number };
};

type Buddy = {
  slug: string;
  name: string;
  status: "online" | "offline";
  specialties: string[];
  pearls: number;
};

type KanbanCard = {
  id: string;
  title: string;
  description: string;
  column: "ideas" | "building" | "deployed" | "improving";
  repo?: string;
  url?: string;
  createdAt: string;
  tags: string[];
};

type Tab = "control" | "kanban" | "agents" | "mail";

// ── Seed Data ──────────────────────────────────────────────
const SEED_AGENTS: Agent[] = [
  { id: "astra", name: "Astra", emoji: "🦞", status: "online", role: "Main Agent — Discord, Telegram, idea pipeline", uptime: "12h 34m", lastAction: "Deployed idea-mood-tracker to Vercel", stats: { tasks: 47, repos: 5, deploys: 3 } },
  { id: "idea-engine", name: "Idea Engine", emoji: "💡", status: "online", role: "Monitors #life-admin, builds & deploys ideas", uptime: "6h 12m", lastAction: "Polling #life-admin for new ideas", stats: { tasks: 12, repos: 3, deploys: 2 } },
  { id: "improver", name: "Code Improver", emoji: "🔧", status: "online", role: "Reviews & upgrades all deployed repos", uptime: "6h 12m", lastAction: "Reviewing idea-mood-tracker", stats: { tasks: 8, repos: 3, deploys: 0 } },
];

const SEED_BUDDIES: Buddy[] = [
  { slug: "astra", name: "Astra (You)", status: "online", specialties: ["nextjs", "typescript", "devops", "aiops", "vercel"], pearls: 5 },
  { slug: "the-hermit", name: "The Hermit", status: "online", specialties: ["clawbuddy", "onboarding", "openclaw", "troubleshooting"], pearls: 0 },
  { slug: "jean", name: "Jean", status: "online", specialties: [], pearls: 0 },
];

const SEED_CARDS: KanbanCard[] = [
  { id: "1", title: "Mood Tracker", description: "Log daily mood with emojis, see trends, get wellness tips", column: "deployed", repo: "idea-mood-tracker", url: "https://idea-mood-tracker.vercel.app", createdAt: "2026-03-19", tags: ["nextjs", "tailwind", "vercel"] },
];

// ── Helpers ────────────────────────────────────────────────
function loadState<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : seed;
}
function saveState<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }

const COL_META: Record<KanbanCard["column"], { label: string; color: string; icon: string }> = {
  ideas: { label: "Ideas", color: "border-violet-500", icon: "💭" },
  building: { label: "Building", color: "border-amber-500", icon: "🏗️" },
  deployed: { label: "Deployed", color: "border-green-500", icon: "🚀" },
  improving: { label: "Improving", color: "border-cyan-500", icon: "🔄" },
};

const COLUMNS: KanbanCard["column"][] = ["ideas", "building", "deployed", "improving"];

// ── Main Page ──────────────────────────────────────────────
export default function MissionControl() {
  const [tab, setTab] = useState<Tab>("control");
  const [agents] = useState<Agent[]>(SEED_AGENTS);
  const [buddies] = useState<Buddy[]>(SEED_BUDDIES);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ title: "", description: "", tags: "" });
  const [mail, setMail] = useState<{ subject: string; to: string; body: string }>({ subject: "", to: "", body: "" });
  const [mailStatus, setMailStatus] = useState("");

  useEffect(() => { setCards(loadState("mc-cards", SEED_CARDS)); }, []);
  useEffect(() => { if (cards.length) saveState("mc-cards", cards); }, [cards]);

  const moveCard = useCallback((id: string, col: KanbanCard["column"]) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, column: col } : c));
  }, []);

  const addCard = () => {
    if (!newCard.title.trim()) return;
    const card: KanbanCard = {
      id: Date.now().toString(),
      title: newCard.title,
      description: newCard.description,
      column: "ideas",
      createdAt: new Date().toISOString().split("T")[0],
      tags: newCard.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    setCards(prev => [...prev, card]);
    setNewCard({ title: "", description: "", tags: "" });
    setShowAdd(false);
  };

  const deleteCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  const totalOnline = agents.filter(a => a.status === "online").length;
  const totalRepos = agents.reduce((s, a) => s + a.stats.repos, 0);
  const totalDeploys = agents.reduce((s, a) => s + a.stats.deploys, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="bg-surface-1 border-b border-surface-3 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎛️</span>
          <h1 className="text-xl font-bold">Mission Control</h1>
          <span className="text-xs bg-brand-600 px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <nav className="flex gap-1">
          {([["control", "🎯 Control"], ["kanban", "📋 Kanban"], ["agents", "🤖 Agents"], ["mail", "📧 Mail"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-surface-3 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-6">
        {/* ── CONTROL TAB ───────────────────────────────── */}
        {tab === "control" && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Agents Online" value={`${totalOnline}/${agents.length}`} icon="🟢" />
              <StatBox label="GitHub Repos" value={totalRepos.toString()} icon="📦" />
              <StatBox label="Deployments" value={totalDeploys.toString()} icon="🚀" />
              <StatBox label="Buddies Paired" value={buddies.length.toString()} icon="🦞" />
            </div>

            {/* Agent grid */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Agent Fleet</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agents.map(a => (
                  <div key={a.id} className="bg-surface-2 border border-surface-3 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{a.emoji}</span>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {a.name}
                          <span className={`w-2 h-2 rounded-full ${a.status === "online" ? "bg-green-400" : a.status === "busy" ? "bg-amber-400" : "bg-gray-500"}`} />
                        </div>
                        <div className="text-xs text-gray-500">{a.role}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">Uptime: {a.uptime}</div>
                    <div className="text-xs text-gray-500 mb-3">Last: {a.lastAction}</div>
                    <div className="flex gap-3 text-xs">
                      <span className="bg-surface-3 px-2 py-1 rounded">Tasks: {a.stats.tasks}</span>
                      <span className="bg-surface-3 px-2 py-1 rounded">Repos: {a.stats.repos}</span>
                      <span className="bg-surface-3 px-2 py-1 rounded">Deploys: {a.stats.deploys}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ClawBuddy */}
            <div>
              <h2 className="text-lg font-semibold mb-3">ClawBuddy Network</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {buddies.map(b => (
                  <div key={b.slug} className="bg-surface-2 border border-surface-3 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${b.status === "online" ? "bg-green-400" : "bg-gray-500"}`} />
                      <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-gray-500">@{b.slug}</span>
                    </div>
                    {b.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {b.specialties.map(s => (
                          <span key={s} className="text-xs bg-brand-600/20 text-brand-100 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">{b.pearls} pearls</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
              <div className="bg-surface-2 border border-surface-3 rounded-xl divide-y divide-surface-3">
                {[
                  { time: "2m ago", icon: "📧", text: "Test email sent via AgentMail to saikiran@agentmail.to" },
                  { time: "5m ago", icon: "🦞", text: "ClawBuddy buddy 'Astra' connected to SSE stream, 5 pearls loaded" },
                  { time: "10m ago", icon: "🥚", text: "Paired with The Hermit — asked about pearl generation" },
                  { time: "30m ago", icon: "🚀", text: "idea-mood-tracker deployed to Vercel (build passed)" },
                  { time: "45m ago", icon: "🔧", text: "Fixed supabase deps, rewrote to localStorage, pushed 15 files" },
                  { time: "1h ago", icon: "💡", text: "Idea Engine started — monitoring #life-admin every 60s" },
                  { time: "1h ago", icon: "📦", text: "Created repo idea-mood-tracker on GitHub" },
                ].map((ev, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <span>{ev.icon}</span>
                    <div className="flex-1 text-sm text-gray-300">{ev.text}</div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── KANBAN TAB ────────────────────────────────── */}
        {tab === "kanban" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Idea Pipeline</h2>
              <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition">+ New Idea</button>
            </div>

            {/* Add card modal */}
            {showAdd && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
                <div className="bg-surface-2 border border-surface-3 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">New Idea</h3>
                  <input placeholder="Title" value={newCard.title} onChange={e => setNewCard(p => ({ ...p, title: e.target.value }))}
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg mb-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                  <textarea placeholder="Description" value={newCard.description} onChange={e => setNewCard(p => ({ ...p, description: e.target.value }))}
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg mb-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" rows={3} />
                  <input placeholder="Tags (comma separated)" value={newCard.tags} onChange={e => setNewCard(p => ({ ...p, tags: e.target.value }))}
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg mb-4 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                    <button onClick={addCard} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">Add to Ideas</button>
                  </div>
                </div>
              </div>
            )}

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {COLUMNS.map(col => {
                const meta = COL_META[col];
                const colCards = cards.filter(c => c.column === col);
                return (
                  <div key={col}
                    className={`bg-surface-1 rounded-xl border-t-2 ${meta.color} min-h-[300px]`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragId) { moveCard(dragId, col); setDragId(null); } }}>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-surface-3">
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <span className="font-medium text-sm">{meta.label}</span>
                      </div>
                      <span className="text-xs bg-surface-3 px-2 py-0.5 rounded-full">{colCards.length}</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {colCards.map(card => (
                        <div key={card.id} draggable
                          onDragStart={() => setDragId(card.id)}
                          onDragEnd={() => setDragId(null)}
                          className={`bg-surface-2 border border-surface-3 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-surface-4 transition ${dragId === card.id ? "opacity-50" : ""}`}>
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-sm">{card.title}</span>
                            <button onClick={() => deleteCard(card.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                          </div>
                          {card.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{card.description}</p>}
                          {card.url && <a href={card.url} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline block mb-2">{card.url}</a>}
                          {card.repo && <div className="text-xs text-gray-500 mb-2">📦 {card.repo}</div>}
                          <div className="flex flex-wrap gap-1">
                            {card.tags.map(t => <span key={t} className="text-[10px] bg-surface-4 px-1.5 py-0.5 rounded text-gray-400">{t}</span>)}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-2">{card.createdAt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AGENTS TAB ────────────────────────────────── */}
        {tab === "agents" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Agent Details</h2>
            {agents.map(a => (
              <div key={a.id} className="bg-surface-2 border border-surface-3 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{a.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {a.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "online" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{a.status}</span>
                    </h3>
                    <p className="text-gray-400 text-sm">{a.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MiniStat label="Uptime" value={a.uptime} />
                  <MiniStat label="Tasks Done" value={a.stats.tasks.toString()} />
                  <MiniStat label="Repos" value={a.stats.repos.toString()} />
                  <MiniStat label="Deploys" value={a.stats.deploys.toString()} />
                </div>
                <div className="mt-4 p-3 bg-surface-1 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Last Action</div>
                  <div className="text-sm text-gray-300">{a.lastAction}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MAIL TAB ──────────────────────────────────── */}
        {tab === "mail" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-lg font-semibold">AgentMail — saikiran@agentmail.to</h2>
            <div className="bg-surface-2 border border-surface-3 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input value={mail.to} onChange={e => setMail(p => ({ ...p, to: e.target.value }))} placeholder="recipient@example.com"
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Subject</label>
                  <input value={mail.subject} onChange={e => setMail(p => ({ ...p, subject: e.target.value }))} placeholder="Subject line"
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Body</label>
                  <textarea value={mail.body} onChange={e => setMail(p => ({ ...p, body: e.target.value }))} placeholder="Write your email..." rows={6}
                    className="w-full p-3 bg-surface-3 border border-surface-4 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <button onClick={async () => {
                  setMailStatus("Sending...");
                  try {
                    const res = await fetch("/api/send-mail", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(mail),
                    });
                    if (res.ok) { setMailStatus("Sent!"); setMail({ to: "", subject: "", body: "" }); }
                    else { const d = await res.json(); setMailStatus(`Error: ${d.error}`); }
                  } catch (e: any) { setMailStatus(`Error: ${e.message}`); }
                  setTimeout(() => setMailStatus(""), 3000);
                }} className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition">
                  Send Email
                </button>
                {mailStatus && <p className={`text-sm text-center ${mailStatus.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{mailStatus}</p>}
              </div>
            </div>
            <div className="bg-surface-2 border border-surface-3 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">Inbox Info</div>
              <div className="text-sm text-gray-300">saikiran@agentmail.to</div>
              <div className="text-xs text-gray-500 mt-1">Emails sent from this dashboard go through the AgentMail API using your agent&apos;s inbox.</div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-surface-1 border-t border-surface-3 px-6 py-3 text-center text-xs text-gray-600">
        Mission Control v1.0 — Powered by OpenClaw + Idea Engine + ClawBuddy + AgentMail
      </footer>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-2 border border-surface-3 rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-1 rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-brand-500">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
