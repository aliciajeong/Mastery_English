import { C, F } from "../utils/appCore";

export function Hdr({ i, t, s, c }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 24, color: c }}>{i}</span>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: c, margin: "4px 0 1px" }}>{t}</h2>
      {s && <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{s}</p>}
    </div>
  );
}

export function Prog({ c, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            width: `${((c + 1) / t) * 100}%`,
            height: "100%",
            background: C.accent,
            borderRadius: 2,
            transition: "width 0.3s",
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontFamily: F.m, color: C.muted, minWidth: 32, textAlign: "right" }}>
        {c + 1}/{t}
      </span>
    </div>
  );
}

export function Nav({ q, t, set, fin }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
      <button
        disabled={q === 0}
        onClick={() => set(q - 1)}
        style={{
          flex: 1,
          padding: 10,
          background: C.border,
          border: "none",
          borderRadius: 7,
          color: q === 0 ? C.muted : C.text,
          cursor: q === 0 ? "not-allowed" : "pointer",
          fontSize: 12,
          opacity: q === 0 ? 0.5 : 1,
        }}
      >
        ← 이전
      </button>
      {q < t - 1 ? (
        <button
          onClick={() => set(q + 1)}
          style={{
            flex: 1,
            padding: 10,
            background: C.accent,
            border: "none",
            borderRadius: 7,
            color: C.bg,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          다음 →
        </button>
      ) : (
        <button
          onClick={fin}
          style={{
            flex: 1,
            padding: 10,
            background: C.accent,
            border: "none",
            borderRadius: 7,
            color: C.bg,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          결과 보기
        </button>
      )}
    </div>
  );
}

export function Back({ f, l = "돌아가기" }) {
  return (
    <button
      onClick={f}
      style={{
        background: C.border,
        border: "none",
        borderRadius: 5,
        padding: "4px 9px",
        color: C.dim,
        cursor: "pointer",
        fontSize: 10,
        marginBottom: 10,
      }}
    >
      ← {l}
    </button>
  );
}

export function Res({ pct, ok, n, items, retry, back, bl }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
        <div style={{ fontSize: 46, fontWeight: 800, color: pct >= 80 ? C.ok : pct >= 50 ? C.warn : C.no }}>{pct}%</div>
        <div style={{ fontSize: 13, color: C.dim }}>
          {ok}/{n} 정답
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {back && (
            <button
              onClick={back}
              style={{ background: C.border, border: "none", borderRadius: 7, padding: "8px 16px", color: C.text, cursor: "pointer", fontSize: 11 }}
            >
              {bl || "돌아가기"}
            </button>
          )}
          <button
            onClick={retry}
            style={{ background: C.accent, border: "none", borderRadius: 7, padding: "8px 16px", color: C.bg, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
          >
            다시 풀기
          </button>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${it.ok ? `${C.ok}33` : `${C.no}33`}`, borderRadius: 6, padding: "8px 10px", marginBottom: 5 }}>
            <div style={{ fontSize: 11, color: C.text, marginBottom: 2 }}>{it.l}</div>
            <div style={{ fontSize: 10, color: it.ok ? C.ok : C.no }}>{it.ok ? "✓ 정답" : `✗ ${it.ua}${it.ca ? ` → 정답: ${it.ca}` : ""}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
