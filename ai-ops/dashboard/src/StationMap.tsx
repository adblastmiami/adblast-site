import type { Agent, RoomId } from "./types";

// Room layout on a 600 x 400 canvas.
const ROOMS: Record<RoomId, { x: number; y: number; w: number; h: number }> = {
  bridge: { x: 225, y: 20, w: 150, h: 92 },
  research: { x: 30, y: 150, w: 160, h: 104 },
  studio: { x: 220, y: 160, w: 160, h: 112 },
  publishing: { x: 410, y: 150, w: 160, h: 104 },
  treasury: { x: 225, y: 310, w: 150, h: 72 },
};

const center = (r: RoomId) => ({ x: ROOMS[r].x + ROOMS[r].w / 2, y: ROOMS[r].y + ROOMS[r].h / 2 });

// Corridors drawn as right-angle paths between room centers.
const LINKS: [RoomId, RoomId][] = [
  ["bridge", "studio"],
  ["research", "studio"],
  ["studio", "publishing"],
  ["studio", "treasury"],
  ["bridge", "research"],
  ["bridge", "publishing"],
];

function corridor(a: RoomId, b: RoomId): string {
  const p = center(a);
  const q = center(b);
  return `M${p.x},${p.y} L${p.x},${(p.y + q.y) / 2} L${q.x},${(p.y + q.y) / 2} L${q.x},${q.y}`;
}

const ROOM_COLOR: Record<RoomId, string> = {
  bridge: "var(--orange)",
  research: "var(--cyan)",
  studio: "var(--pink)",
  publishing: "var(--green)",
  treasury: "var(--gold)",
};

interface Props {
  agents: Agent[];
  rooms: Record<RoomId, string>;
  selected: string;
  onSelect: (agent: string) => void;
}

export function StationMap({ agents, rooms, selected, onSelect }: Props) {
  return (
    <svg className="station" viewBox="0 0 600 400" role="img" aria-label="Station map: where each agent is working">
      <defs>
        <pattern id="floor" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
        </pattern>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* starfield */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={(i * 137) % 600} cy={(i * 89) % 400} r={i % 5 ? 0.6 : 1.1} className="star" />
      ))}

      {LINKS.map(([a, b], i) => (
        <g key={`${a}-${b}`}>
          <path d={corridor(a, b)} className="corridor" />
          <circle r="2.5" className="packet" filter="url(#glow)">
            <animateMotion dur={`${3 + i * 0.7}s`} repeatCount="indefinite" path={corridor(a, b)} keyPoints={i % 2 ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear" />
          </circle>
        </g>
      ))}

      {(Object.keys(ROOMS) as RoomId[]).map((id) => {
        const r = ROOMS[id];
        const crew = agents.filter((a) => a.room === id);
        const isSel = crew.some((a) => a.agent === selected);
        return (
          <g
            key={id}
            className={`room${isSel ? " selected" : ""}`}
            style={{ color: ROOM_COLOR[id] }}
            onClick={() => crew[0] && onSelect(crew[0].agent)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && crew[0] && onSelect(crew[0].agent)}
            aria-label={`${rooms[id]}: ${crew.map((a) => a.callsign).join(", ")}`}
          >
            <rect x={r.x} y={r.y} width={r.w} height={r.h} className="room-wall" />
            <rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 8} fill="url(#floor)" />
            {/* consoles */}
            <rect x={r.x + 10} y={r.y + r.h - 20} width={r.w * 0.35} height={8} className="console" />
            <rect x={r.x + r.w * 0.55} y={r.y + r.h - 20} width={r.w * 0.35} height={8} className="console" />
            <text x={r.x + 8} y={r.y + 15} className="room-label">
              {rooms[id].toUpperCase()}
            </text>
            {crew.map((a, i) => {
              const cx = r.x + r.w / 2 + (i - (crew.length - 1) / 2) * 40;
              const cy = r.y + r.h / 2 + 2;
              return (
                <g key={a.agent} className={a.active ? "crew active" : "crew"}>
                  {a.active && (
                    <circle cx={cx} cy={cy} r="7" className="pulse">
                      <animate attributeName="r" values="7;16;7" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={cx} cy={cy} r="6" className="crew-dot" filter="url(#glow)" />
                  <text x={cx} y={cy + 20} className="crew-label">
                    {a.callsign}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
