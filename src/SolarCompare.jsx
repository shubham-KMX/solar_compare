import { useState, useEffect, useRef } from "react";

const PANELS = [
  { model: "SPL-525W", watt: 525, voc: 49.12, isc: 13.63, vmpp: 41.26, impp: 12.73, eff: 20.31, price: 14000 },
  { model: "SPL-530W", watt: 530, voc: 49.40, isc: 13.72, vmpp: 41.50, impp: 12.82, eff: 20.50, price: 14200 },
  { model: "SPL-535W", watt: 535, voc: 49.65, isc: 13.80, vmpp: 41.72, impp: 12.92, eff: 20.70, price: 14400 },
  { model: "SPL-540W", watt: 540, voc: 49.88, isc: 13.88, vmpp: 41.95, impp: 13.00, eff: 20.90, price: 14600 },
  { model: "SPL-545W", watt: 545, voc: 50.00, isc: 13.92, vmpp: 42.05, impp: 13.04, eff: 21.09, price: 14800 },
  { model: "SPL-550W", watt: 550, voc: 50.10, isc: 13.95, vmpp: 42.10, impp: 13.07, eff: 21.28, price: 15000 },
];

const STATES = [
  { id: "mp",  label: "Madhya Pradesh", irr: 5.5, tariff: 7.5 },
  { id: "raj", label: "Rajasthan",      irr: 6.0, tariff: 7.0 },
  { id: "guj", label: "Gujarat",        irr: 5.8, tariff: 6.5 },
  { id: "mah", label: "Maharashtra",    irr: 5.3, tariff: 8.5 },
  { id: "del", label: "Delhi NCR",      irr: 5.2, tariff: 8.0 },
  { id: "up",  label: "Uttar Pradesh",  irr: 5.0, tariff: 6.0 },
  { id: "kar", label: "Karnataka",      irr: 5.4, tariff: 8.0 },
  { id: "tn",  label: "Tamil Nadu",     irr: 5.5, tariff: 7.5 },
];

function getSubsidy(kw) {
  if (kw <= 1) return 30000;
  if (kw <= 2) return 60000;
  return 78000;
}

function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

function recommend({ bill, roof, budget, stateId }) {
  const st = STATES.find(s => s.id === stateId);
  const { irr, tariff } = st;
  const maxByRoof = Math.floor(roof / 28);
  const annualUnits = (bill / tariff) * 12;
  const systemKW = annualUnits / (irr * 365);
  let bestPanel = PANELS[0];
  for (const p of [...PANELS].reverse()) {
    const num = Math.ceil(systemKW / (p.watt / 1000));
    const cost = num * p.price + num * 3000 + 25000;
    if (cost <= budget && num <= maxByRoof) { bestPanel = p; break; }
  }
  const numPanels = Math.min(
    Math.ceil(systemKW / (bestPanel.watt / 1000)),
    maxByRoof,
    Math.floor(budget / (bestPanel.price + 3000))
  );
  const actualKW = numPanels * (bestPanel.watt / 1000);
  const annualGen = actualKW * irr * 365;
  const annualSavings = Math.round(annualGen * tariff);
  const systemCost = numPanels * bestPanel.price + numPanels * 3000 + 25000;
  const subsidy = getSubsidy(actualKW);
  return { bestPanel, numPanels, actualKW, annualGen, annualSavings, systemCost, payback: systemCost / annualSavings, co2: Math.round(annualGen * 0.82), irr, tariff, subsidy };
}

function AnimCount({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [disp, setDisp] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const s = Date.now(), dur = 900, to = value;
    const tick = () => {
      const p = Math.min((Date.now() - s) / dur, 1);
      setDisp(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span>{prefix}{decimals > 0 ? disp.toFixed(decimals) : Math.round(disp).toLocaleString("en-IN")}{suffix}</span>;
}

function SunIcon({ size = 40, animate = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={animate ? { animation: "spinSlow 20s linear infinite" } : {}}>
      <circle cx="24" cy="24" r="10" fill="#F59E0B" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1={24 + 13 * Math.cos(deg * Math.PI / 180)} y1={24 + 13 * Math.sin(deg * Math.PI / 180)}
          x2={24 + 19 * Math.cos(deg * Math.PI / 180)} y2={24 + 19 * Math.sin(deg * Math.PI / 180)}
          stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Slider({ label, min, max, step, value, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "rgba(120,80,20,0.8)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e", fontFamily: "monospace" }}>{format(value)}</span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 6 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "rgba(251,191,36,0.2)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: pct + "%", borderRadius: 6, background: "linear-gradient(90deg,#F59E0B,#FBBF24)" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }) {
  return (
    <div style={{ background: highlight ? "linear-gradient(135deg,#FEF3C7,#FDE68A)" : "#FFFBEB", border: `1.5px solid ${highlight ? "#F59E0B" : "#FDE68A"}`, borderRadius: 14, padding: "14px 16px", boxShadow: highlight ? "0 4px 20px rgba(245,158,11,0.2)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#92400e", marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    </div>
  );
}

function SpecRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(251,191,36,0.2)" }}>
      <span style={{ fontSize: 13, color: "#92400e", opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? "#B45309" : "#78350f", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function ROIBars({ annualSavings, systemCost }) {
  const years = Array.from({ length: 10 }, (_, i) => i + 1);
  const data = years.map(y => annualSavings * y - systemCost);
  const maxAbs = Math.max(...data.map(Math.abs));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100 }}>
      {years.map((y, i) => {
        const v = data[i], pos = v >= 0, h = (Math.abs(v) / maxAbs) * 80;
        return (
          <div key={y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            {pos && <div style={{ width: "100%", height: h, background: "linear-gradient(180deg,#FBBF24,#F59E0B)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />}
            {!pos && <div style={{ flex: 1 }} />}
            <div style={{ height: 1, width: "100%", background: "rgba(180,83,9,0.25)" }} />
            {!pos && <div style={{ width: "100%", height: h, background: "linear-gradient(180deg,#FCA5A5,#EF4444)", borderRadius: "0 0 3px 3px", minHeight: 2 }} />}
            <span style={{ fontSize: 9, color: "#92400e", opacity: 0.5, marginTop: 2 }}>Y{y}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onToolClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 40); setIsMobile(window.innerWidth < 768); };
    window.addEventListener("scroll", fn);
    window.addEventListener("resize", fn);
    return () => { window.removeEventListener("scroll", fn); window.removeEventListener("resize", fn); };
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", height: 58, background: scrolled ? "rgba(255,251,235,0.97)" : "rgba(255,251,235,0.85)", backdropFilter: "blur(12px)", borderBottom: scrolled ? "1px solid rgba(251,191,36,0.3)" : "none", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <SunIcon size={26} animate />
        <span style={{ fontSize: 18, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>SolarCompare</span>
        <span style={{ fontSize: 10, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 20, border: "1px solid #FDE68A", fontWeight: 600 }}>India</span>
      </div>
      {!isMobile && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => onToolClick("advisor")} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid #FDE68A", background: "transparent", color: "#92400e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Advisor</button>
          <button onClick={() => onToolClick("compare")} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid #FDE68A", background: "transparent", color: "#92400e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Compare Panels</button>
          <button onClick={() => onToolClick("subsidy")} style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(245,158,11,0.35)" }}>Subsidy Calculator</button>
        </div>
      )}
      {isMobile && (
        <button onClick={() => onToolClick("advisor")} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Calculate →
        </button>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onToolClick }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", position: "relative", overflow: "hidden" }}>

      {/* LEFT — text */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "5.5rem 1.5rem 2rem" : "8rem 3rem 4rem 4rem", background: "#FFFBEB", position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FEF3C7", border: "1.5px solid #F59E0B", borderRadius: 20, padding: "6px 14px", marginBottom: "1.25rem", width: "fit-content" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#B45309", fontWeight: 700 }}>India's #1 Free Solar Advisor</span>
        </div>

        <h1 style={{ fontSize: isMobile ? "32px" : "clamp(32px,3.5vw,52px)", fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", lineHeight: 1.15, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          Solar panels ke liye<br />
          <span style={{ color: "#D97706" }}>sahi decision karo</span>
        </h1>

        <p style={{ fontSize: isMobile ? 14 : 16, color: "#92400e", opacity: 0.75, marginBottom: "1.5rem", lineHeight: 1.7, maxWidth: 420 }}>
          Panel recommendation, ROI calculator, PM Surya Ghar subsidy — sab ek jagah. Free mein. 60 seconds mein.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <button onClick={() => onToolClick("advisor")} style={{ padding: "13px 22px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 6px 28px rgba(245,158,11,0.45)" }}>
            Calculate my savings →
          </button>
          <button onClick={() => onToolClick("compare")} style={{ padding: "13px 22px", borderRadius: 12, border: "2px solid #F59E0B", background: "transparent", color: "#B45309", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Compare panels
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[["₹", "✓ Free to use", "No hidden charges, ever"], ["🏛", "✓ PM Surya Ghar", "Subsidy up to ₹78,000 calculated"], ["📲", "✓ WhatsApp quote", "Share with dealer instantly"]].map(([icon, title, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#D97706", flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}>{title}</div>
                <div style={{ fontSize: 11, color: "#92400e", opacity: 0.6 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — photo (full on desktop, strip on mobile) */}
      {isMobile ? (
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80" alt="Solar panels" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(120,53,15,0.5) 100%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#D97706)", borderRadius: 10, padding: "9px 18px", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(245,158,11,0.4)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>PM Surya Ghar Subsidy</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Up to ₹78,000 FREE</div>
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=85" alt="Solar panels on rooftop" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(255,251,235,0.3) 0%, transparent 30%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(120,53,15,0.5) 100%)" }} />
          <div style={{ position: "absolute", top: "20%", left: "8%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderRadius: 14, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(251,191,36,0.4)" }}>
            <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginBottom: 2 }}>ANNUAL SAVINGS</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>₹42,000+</div>
            <div style={{ fontSize: 11, color: "#92400e", opacity: 0.7 }}>avg. Indian household</div>
          </div>
          <div style={{ position: "absolute", top: "45%", right: "8%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderRadius: 14, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(251,191,36,0.4)" }}>
            <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginBottom: 2 }}>PAYBACK PERIOD</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>4–6 yrs</div>
            <div style={{ fontSize: 11, color: "#92400e", opacity: 0.7 }}>then free electricity</div>
          </div>
          <div style={{ position: "absolute", bottom: "12%", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#D97706)", borderRadius: 14, padding: "12px 20px", boxShadow: "0 8px 24px rgba(245,158,11,0.4)", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginBottom: 1 }}>PM Surya Ghar Subsidy</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Up to ₹78,000 FREE</div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "8", suffix: " States", label: "covered" },
    { value: "₹78,000", suffix: "", label: "max subsidy available" },
    { value: "21.28", suffix: "%", label: "peak panel efficiency" },
    { value: "4–6", suffix: " yrs", label: "typical payback period" },
    { value: "300+", suffix: "", label: "sunny days/year in India" },
  ];
  return (
    <section style={{ background: "linear-gradient(135deg,#D97706,#B45309)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1.5rem" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{s.value}{s.suffix}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks({ onToolClick }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const steps = [
    { num: "01", title: "Details bharo", desc: "Apna monthly bill, roof area aur state batao. 30 seconds ka kaam hai." },
    { num: "02", title: "Panel recommendation pao", desc: "Humara system best panel suggest karta hai — efficiency, cost aur subsidy sab consider karke." },
    { num: "03", title: "Quote WhatsApp karo", desc: "Ek tap mein complete quote generate karo aur dealer ko WhatsApp pe bhejo." },
  ];
  return (
    <section style={{ padding: "4rem 1rem", background: "#FFFBEB" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", letterSpacing: "0.1em", marginBottom: 8 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>3 steps mein solar decision</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "2rem" : "4rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#F59E0B,#D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 14px rgba(245,158,11,0.35)" }}>{s.num}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", marginBottom: 5 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "#92400e", opacity: 0.75, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={() => onToolClick("advisor")} style={{ padding: "13px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                Abhi try karo — free hai →
              </button>
            </div>
          </div>
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 48px rgba(180,83,9,0.2)" }}>
            <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" alt="Solar installation" style={{ width: "100%", height: isMobile ? 220 : 400, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(255,251,235,0.95)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "9px 14px", border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700 }}>INDIA AVERAGE</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>₹78,000 subsidy + 5 yr payback</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tool cards ───────────────────────────────────────────────────────────────
function ToolCards({ onToolClick }) {
  const tools = [
    { id: "advisor", img: "https://images.unsplash.com/photo-1548337138-e87d889cc369?w=600&q=80", title: "Solar Advisor", desc: "Bill, roof aur budget batao — best panel recommend karega with full ROI calculation.", cta: "Calculate savings", color: "#F59E0B" },
    { id: "compare", img: "https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&q=80", title: "Panel Comparator", desc: "6 SPL models side-by-side compare karo — efficiency, voltage, current sab ek jagah.", cta: "Compare panels", color: "#D97706" },
    { id: "subsidy", img: "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=600&q=80", title: "Subsidy Calculator", desc: "PM Surya Ghar Muft Bijli Yojana ke under kitni subsidy milegi — state-wise calculate karo.", cta: "Check subsidy", color: "#B45309" },
  ];
  return (
    <section style={{ padding: "5rem 1rem", background: "linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", letterSpacing: "0.1em", marginBottom: 8 }}>OUR TOOLS</div>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Sab kuch ek jagah, free mein</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {tools.map((t, i) => (
            <div key={i} style={{ background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(245,158,11,0.1)", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                <img src={t.img} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 40%, rgba(120,53,15,0.6) 100%)` }} />
                <div style={{ position: "absolute", bottom: 12, left: 16, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{t.title}</div>
              </div>
              <div style={{ padding: "1.25rem 1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14, color: "#92400e", opacity: 0.75, lineHeight: 1.65, flex: 1, marginBottom: "1.25rem" }}>{t.desc}</div>
                <button onClick={() => onToolClick(t.id)}
                  style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: `0 3px 14px ${t.color}55` }}>
                  {t.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: "Ramesh Sharma", city: "Bhopal, MP", text: "Pehle solar ke baare mein kuch nahi pata tha. SolarCompare ne 2 minute mein bata diya kitne panels chahiye aur kitna bachega. Kamal ka tool hai!", stars: 5 },
    { name: "Priya Mehta", city: "Ahmedabad, Gujarat", text: "PM Surya Ghar subsidy calculator ne exactly bataya ₹78,000 milenge. Dealer ke paas gaye toh woh figure bilkul sahi nikla. Bohot helpful!", stars: 5 },
    { name: "Suresh Kumar", city: "Jaipur, Rajasthan", text: "Compare panel feature se pata chala SPL-550W best efficiency deta hai. Mera dealer bhi same recommend kiya. Trust build hua.", stars: 5 },
  ];
  return (
    <section style={{ padding: "5rem 1rem", position: "relative", overflow: "hidden" }}>
      {/* Background image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&q=80" alt="Solar farm background" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,251,235,0.93)" }} />
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", letterSpacing: "0.1em", marginBottom: 8 }}>REVIEWS</div>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Logon ne kya kaha</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1.5px solid #FDE68A", borderRadius: 16, padding: "1.5rem", boxShadow: "0 8px 32px rgba(245,158,11,0.12)" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                {Array.from({ length: r.stars }, (_, j) => <span key={j} style={{ fontSize: 16, color: "#F59E0B" }}>★</span>)}
              </div>
              <p style={{ fontSize: 14, color: "#78350f", lineHeight: 1.7, marginBottom: "1rem", fontStyle: "italic" }}>"{r.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#F59E0B,#D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff" }}>{r.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#92400e", opacity: 0.6 }}>{r.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why us ───────────────────────────────────────────────────────────────────
function WhyUs() {
  const points = [
    { icon: "🆓", title: "Bilkul free", desc: "Koi hidden charge nahi, koi signup nahi. Start karo aur result pao." },
    { icon: "📍", title: "India ke liye banaya", desc: "State-wise DISCOM tariffs, PM Surya Ghar subsidy, Indian panel brands." },
    { icon: "⚡", title: "60 second result", desc: "Bill amount dalte hi system calculate kar deta hai best setup." },
    { icon: "📲", title: "WhatsApp ready quote", desc: "Quote directly WhatsApp pe share karo dealer ya family ko." },
    { icon: "🎯", title: "Accurate data", desc: "MNRE irradiance data aur real DISCOM tariffs use hote hain." },
    { icon: "🔒", title: "No data stored", desc: "Tumhara koi data store nahi hota. Completely private." },
  ];
  return (
    <section style={{ padding: "5rem 1rem", background: "linear-gradient(135deg,#78350f,#92400e)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-50%", right: "-10%", opacity: 0.05, pointerEvents: "none" }}>
        <SunIcon size={500} />
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.1em", marginBottom: 8 }}>WHY SOLARCOMPARE</div>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Kyun use karein?</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          {points.map((p, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#FEF3C7", marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner({ onToolClick }) {
  return (
    <section style={{ padding: "5rem 1rem", background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", textAlign: "center" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}><SunIcon size={48} animate /></div>
        <h2 style={{ fontSize: "clamp(24px,3vw,38px)", fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          Solar pe switch karne ka<br />sahi time ab hai
        </h2>
        <p style={{ fontSize: 15, color: "#92400e", opacity: 0.75, marginBottom: "2rem", lineHeight: 1.6 }}>
          Bijli ka bill kam karo, government subsidy lo, aur planet bachao — ek saath.
        </p>
        <button onClick={() => onToolClick("advisor")}
          style={{ padding: "15px 40px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#D97706,#B45309)", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 6px 28px rgba(180,83,9,0.35)" }}>
          Apna savings calculate karo →
        </button>
      </div>
    </section>
  );
}

// ─── Tool section ─────────────────────────────────────────────────────────────
function ToolSection({ activeTab, toolRef }) {
  const [tab, setTab] = useState(activeTab || "advisor");
  useEffect(() => { if (activeTab) setTab(activeTab); }, [activeTab]);

  const card = { background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 20, padding: "1.75rem", boxShadow: "0 8px 40px rgba(245,158,11,0.1)" };

  return (
    <section ref={toolRef} style={{ padding: "4rem 1rem 5rem", position: "relative", overflow: "hidden", background: "#FFFBEB" }}>
      {/* Decorative background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Soft grid pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(251,191,36,0.18) 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }} />
        {/* Big amber blob top right */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)" }} />
        {/* Big amber blob bottom left */}
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)" }} />
        {/* Faint rotating sun watermark */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.04 }}>
          <SunIcon size={600} animate />
        </div>
      </div>
      <div style={{ maxWidth: 620, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", letterSpacing: "0.1em", marginBottom: 8 }}>TOOLS</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>Solar tools</h2>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: "1.75rem", background: "#FEF3C7", borderRadius: 12, padding: 5 }}>
          {[["advisor","Advisor"],["compare","Compare"],["subsidy","Subsidy"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === id ? "#F59E0B" : "transparent", color: tab === id ? "#fff" : "#92400e", fontSize: 13, fontWeight: tab === id ? 700 : 500, transition: "all 0.2s", boxShadow: tab === id ? "0 2px 10px rgba(245,158,11,0.4)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "advisor" && <AdvisorContent card={card} />}
        {tab === "compare" && <CompareContent />}
        {tab === "subsidy" && <SubsidyContent card={card} />}
      </div>
    </section>
  );
}

function AdvisorContent({ card }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ bill: 3000, roof: 600, budget: 200000, stateId: "mp", custName: "" });
  const [result, setResult] = useState(null);
  function go2() { setResult(recommend(form)); setStep(1); }
  function reset() { setStep(0); setResult(null); setForm({ bill: 3000, roof: 600, budget: 200000, stateId: "mp", custName: "" }); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "1.5rem" }}>
        {["Customer", "Result", "Quote"].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i < step ? "#F59E0B" : i === step ? "#FEF3C7" : "transparent", border: `2px solid ${i <= step ? "#F59E0B" : "#FDE68A"}`, color: i < step ? "#fff" : i === step ? "#78350f" : "#D97706" }}>{i < step ? "✓" : i + 1}</div>
            <span style={{ fontSize: 11, color: i === step ? "#78350f" : "#D97706", fontWeight: i === step ? 700 : 400 }}>{l}</span>
            {i < 2 && <div style={{ width: 20, height: 1.5, background: i < step ? "#F59E0B" : "#FDE68A" }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={{ ...card, animation: "fadeUp 0.35s ease" }}>
          <Slider label="Monthly electricity bill" min={500} max={15000} step={100} value={form.bill} onChange={v => setForm(f => ({ ...f, bill: v }))} format={v => "₹" + v.toLocaleString("en-IN")} />
          <Slider label="Available roof area" min={100} max={3000} step={50} value={form.roof} onChange={v => setForm(f => ({ ...f, roof: v }))} format={v => v + " sq ft"} />
          <Slider label="Customer budget" min={50000} max={1000000} step={10000} value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} format={v => "₹" + (v / 100000).toFixed(1) + "L"} />
          <div style={{ marginBottom: "1.3rem" }}>
            <div style={{ fontSize: 13, color: "rgba(120,80,20,0.8)", marginBottom: 8 }}>State / region</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {STATES.map(s => (<button key={s.id} onClick={() => setForm(f => ({ ...f, stateId: s.id }))} style={{ padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${form.stateId === s.id ? "#F59E0B" : "#FDE68A"}`, background: form.stateId === s.id ? "#FEF3C7" : "#FFFBEB", color: form.stateId === s.id ? "#78350f" : "#B45309", fontSize: 12, fontWeight: form.stateId === s.id ? 700 : 500, cursor: "pointer", textAlign: "left" }}>{s.label}</button>))}
            </div>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 13, color: "rgba(120,80,20,0.8)", marginBottom: 8 }}>Customer name</div>
            <input value={form.custName} onChange={e => setForm(f => ({ ...f, custName: e.target.value }))} placeholder="e.g. Ramesh Sharma" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #FDE68A", background: "#FFFBEB", color: "#78350f", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={go2} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 24px rgba(245,158,11,0.4)" }}>Calculate my solar setup →</button>
        </div>
      )}

      {step === 1 && result && (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          <div style={{ ...card, marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>RECOMMENDED</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}>{result.bestPanel.model}</div>
                <div style={{ fontSize: 13, color: "#92400e", opacity: 0.7, marginTop: 2 }}>{result.numPanels} panels · {result.actualKW.toFixed(1)} kW</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#D97706" }}>Efficiency</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#B45309", fontFamily: "'Outfit', sans-serif" }}>{result.bestPanel.eff}%</div>
              </div>
            </div>
            <SpecRow label="Rated power" value={result.bestPanel.watt + "W / panel"} />
            <SpecRow label="Voc" value={result.bestPanel.voc + " V"} />
            <SpecRow label="Vmpp" value={result.bestPanel.vmpp + " V"} />
            <SpecRow label="Roof needed" value={"~" + result.numPanels * 28 + " sq ft"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
            <StatCard label="Annual savings" value={<AnimCount value={result.annualSavings} prefix="₹" />} icon="💰" highlight />
            <StatCard label="Payback" value={<AnimCount value={result.payback} decimals={1} suffix=" yrs" />} icon="📅" />
            <StatCard label="25-yr savings" value={<AnimCount value={result.annualSavings * 22 / 100000} decimals={1} prefix="₹" suffix="L" />} icon="📈" highlight />
            <StatCard label="CO₂/yr" value={<AnimCount value={result.co2 / 1000} decimals={2} suffix="T" />} icon="🌱" />
          </div>
          <div style={{ ...card, marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginBottom: 8 }}>10-YEAR FORECAST</div>
            <ROIBars annualSavings={result.annualSavings} systemCost={result.systemCost} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setStep(0)} style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #FDE68A", background: "#FFFBEB", color: "#92400e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Edit</button>
            <button onClick={() => setStep(2)} style={{ padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Generate quote →</button>
          </div>
        </div>
      )}

      {step === 2 && result && (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          <div style={{ background: "linear-gradient(135deg,#D97706,#B45309)", borderRadius: 20, padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 8px 32px rgba(180,83,9,0.3)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>SOLAR QUOTE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{form.custName || "Customer"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{STATES.find(s => s.id === form.stateId)?.label} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>Net cost</div><div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{inr(result.systemCost - result.subsidy)}</div></div>
            </div>
          </div>
          <div style={{ ...card, marginBottom: "1rem" }}>
            <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700, marginBottom: 8 }}>SYSTEM</div>
            <SpecRow label={`${result.bestPanel.model} × ${result.numPanels}`} value={inr(result.numPanels * result.bestPanel.price)} />
            <SpecRow label="Installation" value={inr(result.numPanels * 3000)} />
            <SpecRow label="Inverter & wiring" value="₹25,000" />
            <SpecRow label="Gross cost" value={inr(result.systemCost)} />
            <SpecRow label="PM Surya Ghar subsidy" value={"− " + inr(result.subsidy)} highlight />
            <SpecRow label="Net cost" value={inr(result.systemCost - result.subsidy)} highlight />
            <SpecRow label="Annual savings" value={inr(result.annualSavings)} highlight />
            <SpecRow label="Adjusted payback" value={((result.systemCost - result.subsidy) / result.annualSavings).toFixed(1) + " years"} highlight />
          </div>
          <button onClick={() => { const msg = `*Solar Quote — SolarCompare India*\n\n👤 ${form.custName || "Customer"}\n📍 ${STATES.find(s => s.id === form.stateId)?.label}\n\n☀️ ${result.bestPanel.model} × ${result.numPanels} (${result.actualKW.toFixed(1)} kW)\n\n💰 Gross: ${inr(result.systemCost)}\n🏛️ Subsidy: −${inr(result.subsidy)}\n✅ Net: ${inr(result.systemCost - result.subsidy)}\n📈 Annual savings: ${inr(result.annualSavings)}\n⏱️ Payback: ${((result.systemCost - result.subsidy) / result.annualSavings).toFixed(1)} yrs\n\n_SolarCompare India_`; window.open("https://wa.me/?text=" + encodeURIComponent(msg)); }} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Share via WhatsApp</button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "11px", borderRadius: 12, border: "1.5px solid #FDE68A", background: "#FFFBEB", color: "#92400e", fontSize: 13, cursor: "pointer" }}>← Back</button>
            <button onClick={reset} style={{ padding: "11px", borderRadius: 12, border: "1.5px solid #F59E0B", background: "#FEF3C7", color: "#B45309", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>New customer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareContent() {
  const [selected, setSelected] = useState(new Set([0, 5]));
  const specs = [
    { key: "watt", label: "Rated power", unit: "W" },
    { key: "eff", label: "Module efficiency", unit: "%" },
    { key: "voc", label: "Open circuit voltage", unit: "V" },
    { key: "isc", label: "Short circuit current", unit: "A" },
    { key: "vmpp", label: "Max power voltage", unit: "V" },
    { key: "impp", label: "Max power current", unit: "A" },
    { key: "price", label: "Indicative price", unit: "₹" },
  ];
  const active = PANELS.filter((_, i) => selected.has(i));
  const maxEff = Math.max(...active.map(p => p.eff));
  function toggle(i) { setSelected(prev => { const next = new Set(prev); if (next.has(i)) { if (next.size > 1) next.delete(i); } else next.add(i); return next; }); }
  return (
    <div>
      <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 13, color: "#92400e", marginBottom: 10, fontWeight: 600 }}>Select panels to compare</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PANELS.map((p, i) => (<button key={i} onClick={() => toggle(i)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${selected.has(i) ? "#F59E0B" : "#FDE68A"}`, background: selected.has(i) ? "#FEF3C7" : "#FFFBEB", color: selected.has(i) ? "#78350f" : "#B45309", fontSize: 12, fontWeight: selected.has(i) ? 700 : 500, cursor: "pointer", fontFamily: "monospace" }}>{p.model}</button>))}
        </div>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 16, border: "1.5px solid #FDE68A" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#FFFBEB" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#92400e", fontWeight: 700, fontSize: 12, borderBottom: "1.5px solid #FDE68A" }}>Specification</th>
              {active.map((p, i) => (<th key={i} style={{ padding: "12px 16px", textAlign: "center", color: "#78350f", fontWeight: 800, fontSize: 12, borderBottom: "1.5px solid #FDE68A", fontFamily: "monospace", whiteSpace: "nowrap" }}>{p.model}</th>))}
            </tr>
          </thead>
          <tbody>
            {specs.map((spec, si) => {
              const vals = active.map(p => p[spec.key]);
              const maxVal = Math.max(...vals);
              return (
                <tr key={si} style={{ background: si % 2 === 0 ? "#FFFBEB" : "rgba(254,243,199,0.5)" }}>
                  <td style={{ padding: "10px 16px", color: "#92400e", borderBottom: "1px solid rgba(253,230,138,0.5)" }}>{spec.label}</td>
                  {active.map((p, pi) => { const val = p[spec.key]; const isBest = val === maxVal; const display = spec.unit === "₹" ? inr(val) : val + " " + spec.unit; return (<td key={pi} style={{ padding: "10px 16px", textAlign: "center", borderBottom: "1px solid rgba(253,230,138,0.5)", fontFamily: "monospace", fontWeight: isBest ? 800 : 500, color: isBest ? "#B45309" : "#78350f", background: isBest && active.length > 1 ? "rgba(251,191,36,0.12)" : "transparent" }}>{display}{isBest && active.length > 1 && <span style={{ display: "block", fontSize: 9, color: "#D97706", fontWeight: 700 }}>▲ best</span>}</td>); })}
                </tr>
              );
            })}
            <tr style={{ background: "#FEF3C7" }}>
              <td style={{ padding: "10px 16px", color: "#92400e", fontSize: 12 }}>Efficiency bar</td>
              {active.map((p, pi) => (<td key={pi} style={{ padding: "10px 16px" }}><div style={{ width: "100%", height: 6, background: "rgba(180,83,9,0.15)", borderRadius: 4 }}><div style={{ height: "100%", width: (p.eff / maxEff * 100) + "%", background: p.eff === maxEff ? "linear-gradient(90deg,#F59E0B,#FBBF24)" : "rgba(217,119,6,0.4)", borderRadius: 4 }} /></div><span style={{ fontSize: 10, color: "#92400e", fontFamily: "monospace" }}>{p.eff}%</span></td>))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubsidyContent({ card }) {
  const [kw, setKw] = useState(3);
  const [stateId, setStateId] = useState("mp");
  const central = getSubsidy(kw);
  const stateBonus = { mp: 10000, raj: 15000, guj: 20000, mah: 5000, del: 2000, up: 8000, kar: 12000, tn: 10000 };
  const bonus = stateBonus[stateId] || 0;
  const total = central + bonus;
  const rough = kw * 65000;
  const net = rough - total;
  const st = STATES.find(s => s.id === stateId);
  const annualSavings = Math.round(kw * st.irr * 365 * st.tariff);
  const payback = net / annualSavings;
  const slabs = [
    { range: "Up to 1 kW", central: "₹30,000", active: kw <= 1 },
    { range: "1 – 2 kW", central: "₹60,000", active: kw > 1 && kw <= 2 },
    { range: "2 – 3 kW", central: "₹78,000", active: kw > 2 && kw <= 3 },
    { range: "Above 3 kW", central: "₹78,000 (cap)", active: kw > 3 },
  ];
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", border: "1.5px solid #F59E0B", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#B45309", marginBottom: 4 }}>PM SURYA GHAR MUFT BIJLI YOJANA</div>
        <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.65 }}>Central govt subsidy for residential rooftop solar. Up to <strong>₹78,000</strong> for 2–3 kW systems. Apply at <span style={{ color: "#B45309", fontWeight: 700 }}>pmsuryaghar.gov.in</span></div>
      </div>
      <div style={{ ...card, marginBottom: "1.25rem" }}>
        <Slider label="System size" min={1} max={10} step={0.5} value={kw} onChange={setKw} format={v => v + " kW"} />
        <div style={{ fontSize: 13, color: "rgba(120,80,20,0.8)", marginBottom: 8 }}>Your state</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {STATES.map(s => (<button key={s.id} onClick={() => setStateId(s.id)} style={{ padding: "7px 10px", borderRadius: 10, border: `1.5px solid ${stateId === s.id ? "#F59E0B" : "#FDE68A"}`, background: stateId === s.id ? "#FEF3C7" : "#FFFBEB", color: stateId === s.id ? "#78350f" : "#B45309", fontSize: 12, fontWeight: stateId === s.id ? 700 : 500, cursor: "pointer", textAlign: "left" }}>{s.label}</button>))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
        <div style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", border: "1.5px solid #F59E0B", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>Central subsidy</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}><AnimCount value={central} prefix="₹" /></div>
        </div>
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>State top-up (est.)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#78350f", fontFamily: "'Outfit', sans-serif" }}><AnimCount value={bonus} prefix="₹" /></div>
        </div>
        <StatCard label="Total subsidy" value={<AnimCount value={total} prefix="₹" />} icon="🎁" highlight />
        <StatCard label="Net cost" value={<AnimCount value={net} prefix="₹" />} icon="💡" highlight />
        <StatCard label="Annual savings" value={inr(annualSavings)} icon="📈" />
        <StatCard label="Payback" value={<AnimCount value={payback} decimals={1} suffix=" yrs" />} icon="⏱️" />
      </div>
      <div style={{ ...card }}>
        <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginBottom: 10 }}>SUBSIDY SLABS</div>
        {slabs.map((s, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, marginBottom: 6, background: s.active ? "#FEF3C7" : "transparent", border: `1px solid ${s.active ? "#F59E0B" : "transparent"}`, transition: "all 0.3s" }}><span style={{ fontSize: 13, color: "#92400e", fontWeight: s.active ? 700 : 400 }}>{s.range}</span><span style={{ fontSize: 13, fontWeight: 700, color: s.active ? "#B45309" : "#D97706", fontFamily: "monospace" }}>{s.central}</span></div>))}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#78350f", padding: "3rem 1rem 2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <SunIcon size={24} />
              <span style={{ fontSize: 18, fontWeight: 800, color: "#FEF3C7", fontFamily: "'Outfit', sans-serif" }}>SolarCompare</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>India's free solar panel advisor. Panel recommendation, ROI calculator, aur subsidy check — sab ek jagah.</p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.08em", marginBottom: 12 }}>TOOLS</div>
            {["Solar Advisor", "Panel Comparator", "Subsidy Calculator"].map((t, i) => (<div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 8, cursor: "pointer" }}>{t}</div>))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.08em", marginBottom: 12 }}>RESOURCES</div>
            {["MNRE India", "PM Surya Ghar", "DISCOM Tariffs"].map((t, i) => (<div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{t}</div>))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2025 SolarCompare India. All rights reserved.</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Data: MNRE · DISCOM · pmsuryaghar.gov.in</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SolarCompare() {
  const [activeTab, setActiveTab] = useState(null);
  const toolRef = useRef(null);

  function onToolClick(tab) {
    setActiveTab(tab);
    setTimeout(() => {
      toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Nunito:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FFFBEB; font-family: 'Nunito', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.3); } }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #F59E0B; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(245,158,11,0.4); }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        button { transition: all 0.15s ease; font-family: 'Nunito', sans-serif; }
        button:hover { filter: brightness(0.95); transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        html { scroll-behavior: smooth; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#FFFBEB" }}>
        <Navbar onToolClick={onToolClick} />
        <Hero onToolClick={onToolClick} />
        <StatsBar />
        <HowItWorks onToolClick={onToolClick} />
        <ToolCards onToolClick={onToolClick} />
        <ToolSection activeTab={activeTab} toolRef={toolRef} />
        <Testimonials />
        <WhyUs />
        <CTABanner onToolClick={onToolClick} />
        <Footer />
      </div>
    </>
  );
}