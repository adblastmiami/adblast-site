import { useEffect, useState } from "react";
import { StationMap } from "./StationMap";
import type { Dashboard } from "./types";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function Meter({ label, value, cap }: { label: string; value: number; cap: number }) {
  const pct = Math.min(100, (value / cap) * 100);
  return (
    <div className="cell">
      <span className="cell-label">{label}</span>
      <span className="cell-value">
        {usd(value)} <small>/ {usd(cap)}</small>
      </span>
      <span className="meter" aria-hidden>
        <span style={{ width: `${pct}%` }} className={pct > 85 ? "hot" : ""} />
      </span>
    </div>
  );
}

type Tab = "station" | "production" | "reports";

export function App() {
  const [data, setData] = useState<Dashboard | null | "empty" | "error">(null);
  const [tab, setTab] = useState<Tab>("station");
  const [selected, setSelected] = useState("hermes");

  useEffect(() => {
    fetch("data/dashboard.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d.empty ? "empty" : d))
      .catch(() => setData("error"));
  }, []);

  if (data === null) return <div className="boot">BOOTING PALMPOP-OS…</div>;
  if (data === "error") return <div className="boot">SIGNAL LOST: could not load dashboard data.</div>;
  if (data === "empty")
    return (
      <div className="boot">
        PALMPOP-OS ONLINE
        <br />
        Awaiting Hermes' first run.
      </div>
    );

  const agent = data.agents.find((a) => a.agent === selected) ?? data.agents[0];
  const online = data.agents.filter((a) => a.active).length;

  return (
    <div className="hq">
      <header className="topbar">
        <h1 className="logo">PALMPOP-OS</h1>
        <div className="cells">
          <div className="cell">
            <span className="cell-label">ETSY REV</span>
            <span className="cell-value">{data.etsy.connected ? usd(data.etsy.revenue) : "—"}</span>
            {!data.etsy.connected && <span className="cell-note">not connected</span>}
          </div>
          <div className="cell">
            <span className="cell-label">ORDERS</span>
            <span className="cell-value">{data.etsy.connected ? data.etsy.orders : "—"}</span>
          </div>
          <Meter label="AI SPEND" value={data.money.aiMonth} cap={data.money.aiCap} />
          <Meter label="TOTAL SPEND" value={data.money.totalMonth} cap={data.money.totalCap} />
          <div className="cell">
            <span className="cell-label">LAST RUN</span>
            <span className="cell-value">{ago(data.generatedAt)}</span>
            <span className="cell-note">{usd(data.money.lastRun)}</span>
          </div>
          <div className="cell">
            <span className="cell-label">MODE</span>
            <span className={`pill ${data.mode === "AUTOPILOT" ? "on" : "dry"}`}>{data.mode}</span>
          </div>
          <div className="cell">
            <span className="cell-label">HEALTH</span>
            <span className={`pill ${data.health === "NOMINAL" ? "on" : "bad"}`}>{data.health}</span>
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {(["station", "production", "reports"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {tab === "station" && (
        <main className="grid">
          <section className="panel roster">
            <h2>
              PROC:// AGENTS <span className="badge">{online} ONLINE</span>
            </h2>
            {data.agents.map((a) => (
              <button key={a.agent} className={`agent${a.agent === selected ? " selected" : ""}`} onClick={() => setSelected(a.agent)}>
                <span className={`dot${a.active ? " live" : ""}`} />
                <span className="agent-main">
                  <span className="callsign">{a.callsign}</span>
                  <span className="task">{a.task}</span>
                </span>
                <span className="agent-side">
                  <span className="room-tag">{data.rooms[a.room].toUpperCase()}</span>
                  <span className="spend">{usd(a.spendMonth)}</span>
                </span>
              </button>
            ))}
          </section>

          <section className="panel map">
            <h2>STATION MAP</h2>
            <StationMap agents={data.agents} rooms={data.rooms} selected={selected} onSelect={setSelected} />
            <div className="detail">
              <div className="detail-head">
                <span className="detail-kicker">{data.rooms[agent.room].toUpperCase()}</span>
                <span className="detail-name">{agent.callsign}</span>
              </div>
              <dl>
                <dt>ROLE</dt>
                <dd>{agent.role}</dd>
                <dt>STATUS</dt>
                <dd>{agent.task}</dd>
                <dt>SPEND (MONTH)</dt>
                <dd>{usd(agent.spendMonth)}</dd>
                {agent.playbook.rules > 0 && (
                  <>
                    <dt>PLAYBOOK</dt>
                    <dd>{agent.playbook.rules} rules</dd>
                  </>
                )}
              </dl>
              {agent.playbook.latest.length > 0 && (
                <ul className="lessons">
                  {agent.playbook.latest.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="panel side">
            <h2>
              NEEDS YOU <span className="badge warn">{data.approvals.length + data.uploads.length}</span>
            </h2>
            {data.approvals.length === 0 && data.uploads.length === 0 && <p className="muted">All clear. Nothing waiting on you.</p>}
            {data.approvals.map((b) => (
              <a key={b.id} className="action" href={b.url} target="_blank" rel="noreferrer">
                <span>APPROVE BATCH {b.id}</span>
                <small>
                  {b.listings} listings · {usd(b.feesUsd)} fees
                </small>
              </a>
            ))}
            {data.uploads.map((id) => (
              <div key={id} className="action upload">
                <span>UPLOAD BATCH {id}</span>
                <small>ai-ops/data/ready-to-upload/{id}/</small>
              </div>
            ))}

            <h2 className="spaced">ACTIVITY LOG</h2>
            <ol className="log">
              {[...data.log].reverse().map((l, i) => (
                <li key={i} className={l.startsWith("ERROR") ? "err" : ""}>
                  {l}
                </li>
              ))}
            </ol>
          </section>
        </main>
      )}

      {tab === "production" && (
        <main className="production">
          <section className="panel">
            <h2>ETSY PRODUCTION TERMINAL</h2>
            <div className="stats">
              <div className="stat">
                <span>{data.products.length}</span>PRODUCTS
              </div>
              <div className="stat">
                <span>{data.approvals.length}</span>AWAITING OK
              </div>
              <div className="stat">
                <span>{data.uploads.length}</span>READY TO UPLOAD
              </div>
              <div className="stat">
                <span>{data.backlog.length}</span>IDEAS QUEUED
              </div>
            </div>
            {data.products.length === 0 && <p className="muted">No products yet.</p>}
            <div className="gallery">
              {data.products.map((p) => (
                <figure key={p.id} className="product">
                  {p.thumb ? <img src={p.thumb} alt={p.title} loading="lazy" /> : <div className="no-thumb">NO PREVIEW</div>}
                  <figcaption>
                    <span className="p-title">{p.title}</span>
                    <span className="p-meta">
                      {usd(p.priceUsd)} · LANE {p.lane} · <span className={`status s-${p.status}`}>{p.status.replace(/_/g, " ").toUpperCase()}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>LISTING QUEUE (NEXT UP)</h2>
            {data.backlog.length === 0 && <p className="muted">Queue empty. NOVA refills it on the next run.</p>}
            <ol className="queue">
              {data.backlog.map((b) => (
                <li key={b.name}>
                  <span>{b.name}</span>
                  <small>
                    {usd(b.priceUsd)} · LANE {b.lane} · {b.sellBy === "evergreen" ? "EVERGREEN" : `LIVE BY ${b.sellBy}`}
                  </small>
                </li>
              ))}
            </ol>
          </section>
        </main>
      )}

      {tab === "reports" && (
        <main className="production">
          <section className="panel">
            <h2>DAILY REPORT</h2>
            <pre className="report">{data.report}</pre>
          </section>
        </main>
      )}

      <footer className="foot">
        {data.shopName.toUpperCase()} · HERMES COMMAND · UPDATED {new Date(data.generatedAt).toLocaleString()}
      </footer>
    </div>
  );
}
