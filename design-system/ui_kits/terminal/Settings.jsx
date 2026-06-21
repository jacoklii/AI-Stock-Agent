// Settings — profile, auth, watchlist, AI agent, notifications, display.
// Exported as window.Settings; mounted in Desk when navPage === "settings".

const { Button, TierBadge } = window.AIStockAgentDesignSystem_ea6e23;
const { useState: useStateSett, useRef: useRefSett } = React;

// ── small shared primitives ──────────────────────────────────────────────────

function Tog({ on, onChange }) {
  return (
    <button type="button" aria-pressed={on}
      className={`sett__tog ${on ? "sett__tog--on" : "sett__tog--off"}`}
      onClick={() => onChange(!on)}>
      <span className={`sett__togknob${on ? " sett__togknob--on" : ""}`} />
    </button>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="sett__seg">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <button key={v} type="button"
            className={`sett__segbtn${value === v ? " sett__segbtn--on" : ""}`}
            onClick={() => onChange(v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

function BlurField({ id, value, revealed, onToggle }) {
  return (
    <span className="sett__blurwrap">
      <span className={`sett__blurval${revealed ? " sett__blurval--on" : ""}`}>{value}</span>
      <button type="button" className="sett__eyebtn" onClick={() => onToggle(id)}
        title={revealed ? "Hide" : "Reveal"}>
        <window.Icon name={revealed ? "eye-off" : "eye"} size={13} />
      </button>
    </span>
  );
}

function SRow({ label, hint, children, noBorder }) {
  return (
    <div className={`sett__row${noBorder ? " sett__row--nb" : ""}`}>
      <div className="sett__rl">
        <span className="sett__rlname">{label}</span>
        {hint && <span className="sett__rlhint">{hint}</span>}
      </div>
      <div className="sett__rc">{children}</div>
    </div>
  );
}

function Sec({ id, title, children }) {
  return (
    <section id={"sett-" + id} className="sett__sec">
      <h2 className="sett__sech">{title}</h2>
      <div className="sett__secbody">{children}</div>
    </section>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const SETT_CSS = `
  .sett{ display:flex; flex:1; min-height:0; overflow:hidden; background:var(--bg-app); }

  /* Docs-style plain text sidenav */
  .sett__sidenav{ flex:none; width:160px; border-right:1px solid var(--border-default);
    background:var(--surface-panel); padding:28px 0 22px; display:flex; flex-direction:column;
    gap:1px; overflow-y:auto; }
  .sett__snavhead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.14em;
    color:var(--text-dim); padding:0 20px 14px; }
  .sett__snavitem{ display:block; padding:7px 20px;
    font-family:var(--font-sans); font-size:13px; color:var(--text-muted);
    background:transparent; border:none; cursor:pointer; text-align:left; width:100%;
    transition:color var(--dur-fast) var(--ease-out); }
  .sett__snavitem:hover{ color:var(--text-strong); }
  .sett__snavitem--active{ color:var(--text-strong); font-weight:600; }

  .sett__scroll{ flex:1; overflow-y:auto; }
  .sett__content{ max-width:620px; padding:32px 44px 64px; display:flex; flex-direction:column; gap:36px; }

  .sett__sec{ display:flex; flex-direction:column; }
  .sett__sech{ font-family:var(--font-sans); font-size:15px; font-weight:600; color:var(--text-strong);
    margin:0; padding-bottom:13px; border-bottom:1px solid var(--border-strong); }
  .sett__secbody{ display:flex; flex-direction:column; }

  .sett__row{ display:flex; align-items:center; justify-content:space-between; gap:24px;
    padding:12px 0; border-bottom:1px solid var(--border-default); min-height:48px; }
  .sett__row--nb{ border-bottom:0; }
  .sett__rl{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .sett__rlname{ font-family:var(--font-sans); font-size:13px; color:var(--text-body); line-height:1.4; }
  .sett__rlhint{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); line-height:1.5; }
  .sett__rlhint--err{ color:var(--down-500); }
  .sett__rc{ flex:none; display:flex; align-items:center; gap:8px; }
  .sett__val{ font-family:var(--font-mono); font-size:12px; color:var(--text-muted); }

  .sett__avatarrow{ display:flex; align-items:center; gap:16px; padding:16px 0 20px;
    border-bottom:1px solid var(--border-default); }
  .sett__avatar{ width:48px; height:48px; border-radius:999px; background:var(--accent);
    display:flex; align-items:center; justify-content:center; flex:none;
    font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--bg-app); letter-spacing:.04em; }
  .sett__avname{ font-family:var(--font-sans); font-size:15px; font-weight:600; color:var(--text-strong); }
  .sett__avsub{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }

  .sett__verified{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase;
    letter-spacing:.1em; color:var(--up-500); border:1px solid var(--up-500);
    border-radius:var(--radius-xs); padding:2px 5px; }

  .sett__blurwrap{ display:inline-flex; align-items:center; gap:7px; }
  .sett__blurval{ font-family:var(--font-mono); font-size:12px; color:var(--text-body);
    filter:blur(4px); user-select:none; transition:filter var(--dur-base) var(--ease-out); }
  .sett__blurval--on{ filter:none; user-select:text; }
  .sett__eyebtn{ display:flex; align-items:center; justify-content:center; width:22px; height:22px;
    background:transparent; border:1px solid var(--border-default); border-radius:var(--radius-sm);
    color:var(--text-dim); cursor:pointer; }
  .sett__eyebtn:hover{ color:var(--text-strong); border-color:var(--border-strong); }

  .sett__input{ font-family:var(--font-sans); font-size:13px; color:var(--text-strong);
    background:var(--surface-inset); border:1px solid var(--border-strong);
    border-radius:var(--radius-sm); padding:6px 10px; width:220px;
    transition:border-color var(--dur-fast) var(--ease-out); }
  .sett__input:focus{ outline:none; border-color:var(--accent); }

  .sett__tog{ width:36px; height:20px; border-radius:999px; border:none; cursor:pointer;
    display:flex; align-items:center; padding:0 3px; flex:none;
    transition:background var(--dur-base) var(--ease-out); }
  .sett__tog--on{ background:var(--accent); }
  .sett__tog--off{ background:var(--surface-inset); border:1px solid var(--border-strong); }
  .sett__togknob{ width:14px; height:14px; border-radius:999px; background:var(--surface-panel);
    flex:none; box-shadow:0 1px 3px oklch(0.4 0.02 70 / 0.2);
    transition:transform var(--dur-base) var(--ease-out); }
  .sett__togknob--on{ transform:translateX(16px); }

  .sett__seg{ display:flex; border:1px solid var(--border-strong); border-radius:var(--radius-sm); overflow:hidden; }
  .sett__segbtn{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); padding:5px 12px;
    background:transparent; border:none; border-right:1px solid var(--border-default); cursor:pointer;
    transition:background var(--dur-fast), color var(--dur-fast); }
  .sett__segbtn:last-child{ border-right:0; }
  .sett__segbtn:hover{ background:var(--surface-hover); color:var(--text-strong); }
  .sett__segbtn--on{ background:var(--surface-raised); color:var(--text-strong); font-weight:600; }

  .sett__range{ -webkit-appearance:none; appearance:none; height:4px;
    background:var(--surface-inset); border-radius:999px; cursor:pointer; width:120px; outline:none; }
  .sett__range::-webkit-slider-thumb{ -webkit-appearance:none; width:14px; height:14px;
    border-radius:999px; background:var(--accent); cursor:pointer; }
  .sett__range::-moz-range-thumb{ width:14px; height:14px; border-radius:999px;
    background:var(--accent); border:none; cursor:pointer; }

  /* Auth */
  .sett__authcard{ background:var(--surface-raised); border:1px solid var(--border-default);
    border-radius:var(--radius-md); padding:20px 20px 18px; display:flex; flex-direction:column; gap:14px; }
  .sett__authcardhead{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase;
    letter-spacing:.12em; color:var(--text-muted); margin-bottom:2px; }
  .sett__authinputrow{ display:flex; flex-direction:column; gap:5px; }
  .sett__authlabel{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .sett__authdivider{ display:flex; align-items:center; gap:12px; }
  .sett__authdivider::before,.sett__authdivider::after{ content:""; flex:1; height:1px; background:var(--border-default); }
  .sett__authdividertext{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .sett__authcards{ display:flex; flex-direction:column; gap:10px; margin-top:2px; }

  /* Watchlist table */
  .sett__wltable{ margin:10px 0 0; display:flex; flex-direction:column; }
  .sett__wlhead{ display:grid; grid-template-columns:56px 1fr auto auto 26px; gap:12px; align-items:center;
    padding:0 0 7px; border-bottom:1px solid var(--border-default);
    font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .sett__wlrow{ display:grid; grid-template-columns:56px 1fr auto auto 26px; gap:12px;
    align-items:center; padding:9px 0; border-bottom:1px solid var(--border-default); }
  .sett__wlrow:last-child{ border-bottom:0; }
  .sett__wlticker{ font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-strong); }
  .sett__wlname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sett__wlalert{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
  .sett__wlremove{ display:flex; align-items:center; justify-content:center; width:22px; height:22px;
    background:transparent; border:none; color:var(--text-dim); cursor:pointer;
    border-radius:var(--radius-sm); transition:background var(--dur-fast), color var(--dur-fast); }
  .sett__wlremove:hover{ background:var(--surface-hover); color:var(--down-500); }
`;

// ── main component ────────────────────────────────────────────────────────────

function Settings({ following, setFollowing }) {
  window.useStyle("kit-settings", SETT_CSS);

  const [revealed, setRevealed]           = useStateSett({});
  const scrollRef                         = useRefSett(null);

  // Profile
  const [displayName, setDisplayName] = useStateSett("James Chen");
  const [email, setEmail]             = useStateSett("james.chen@icloud.com");
  const [password, setPassword]       = useStateSett("trader2024");
  const [phone, setPhone]             = useStateSett("+1 (646) 555-0182");

  // Credential gate — each field's edit box only appears after verifying the current password
  const [unlocked, setUnlocked] = useStateSett({ email:false, password:false, phone:false });
  const [gateOpen, setGateOpen] = useStateSett(null);
  const [gatePw, setGatePw]     = useStateSett("");
  const [gateErr, setGateErr]   = useStateSett(false);

  const maskUser  = (e) => { const at = e.indexOf("@"); return at < 0 ? e : "•".repeat(at) + e.slice(at); };
  const maskPhone = (p) => {
    const total = (p.match(/\d/g) || []).length; let seen = 0;
    return p.replace(/\d/g, () => (++seen > total - 4 ? p.replace(/\D/g, "").slice(-4)[seen - 1 - (total - 4)] : "•"));
  };

  // Auth
  const [twoFA, setTwoFA] = useStateSett(true);

  // Watchlist
  const [autoAdd, setAutoAdd]         = useStateSett(true);
  const [proposeFirst, setProposeFirst] = useStateSett(false);

  // Agent
  const [researchDepth, setResearchDepth]       = useStateSett("standard");
  const [researchSchedule, setResearchSchedule] = useStateSett("daily");

  // Notifications
  const [alertChannel, setAlertChannel]   = useStateSett("email");
  const [priceAlertPct, setPriceAlertPct] = useStateSett(5);
  const [dailyDigest, setDailyDigest]     = useStateSett(true);
  const [weeklyDigest, setWeeklyDigest]   = useStateSett(false);

  // Display
  const [refreshInterval, setRefreshInterval] = useStateSett("15m");

  const toggleReveal = (id) => setRevealed(r => ({ ...r, [id]: !r[id] }));
  const openGate   = (field) => { setGateOpen(field); setGatePw(""); setGateErr(false); };
  const cancelGate = () => { setGateOpen(null); setGatePw(""); setGateErr(false); };
  const lockField  = (field) => setUnlocked(u => ({ ...u, [field]: false }));
  const submitGate = (field) => {
    if (gatePw === password) { setUnlocked(u => ({ ...u, [field]: true })); setGateOpen(null); setGatePw(""); setGateErr(false); }
    else setGateErr(true);
  };
  const credControls = (field, value, setValue, masked, type = "text") => {
    if (unlocked[field]) return (
      <React.Fragment>
        <input className="sett__input" type={type} value={value} style={{ width:"180px" }}
          onChange={e => setValue(e.target.value)} />
        <Button variant="ghost" size="sm" onClick={() => lockField(field)}>Lock</Button>
      </React.Fragment>
    );
    if (gateOpen === field) return (
      <React.Fragment>
        <input className="sett__input" type="password" placeholder="Current password"
          style={{ width:"140px" }} autoFocus value={gatePw}
          onChange={e => { setGatePw(e.target.value); setGateErr(false); }}
          onKeyDown={e => { if (e.key === "Enter") submitGate(field); }} />
        <Button variant="primary" size="sm" onClick={() => submitGate(field)}>Unlock</Button>
        <Button variant="ghost" size="sm" onClick={cancelGate}>Cancel</Button>
      </React.Fragment>
    );
    return (
      <React.Fragment>
        <span className="sett__val">{masked}</span>
        <Button variant="secondary" size="sm" onClick={() => openGate(field)}>Edit</Button>
      </React.Fragment>
    );
  };
  const credHint = (field, base) =>
    gateOpen === field
      ? (gateErr ? "Incorrect password — try again" : "Enter your current password (demo: trader2024)")
      : base;
  const removeStock  = (ticker) => setFollowing(prev => prev.filter(f => f.ticker !== ticker));
  const initials     = displayName.split(" ").map(w => w[0]).slice(0, 2).join("");

  return (
    <div className="sett">

      {/* ── main scroll ── */}
      <div className="sett__scroll" ref={scrollRef}>
        <div className="sett__content">

          {/* PROFILE */}
          <Sec id="profile" title="Profile">
            <div className="sett__avatarrow">
              <div className="sett__avatar">{initials}</div>
              <div>
                <div className="sett__avname">{displayName}</div>
                <div className="sett__avsub">Personal workspace</div>
              </div>
            </div>
            <SRow label="Display name" hint="Shown in session history and alerts">
              <input className="sett__input" value={displayName}
                onChange={e => setDisplayName(e.target.value)} />
            </SRow>
            <SRow label="Password" hint={credHint("password", "Used to sign in to your account")}>
              {credControls("password", password, setPassword, "••••••••••••")}
            </SRow>
            <SRow label="Email" hint={credHint("email", "Used for alerts and digest")}>
              {credControls("email", email, setEmail, maskUser(email))}
            </SRow>
            <SRow label="Phone" hint={credHint("phone", "Optional · SMS alerts")}>
              {credControls("phone", phone, setPhone, maskPhone(phone))}
            </SRow>
            <SRow label="Timezone" hint="Affects digest delivery and alert timestamps" noBorder>
              <span className="sett__val">America/New_York (UTC−4)</span>
            </SRow>
          </Sec>

          {/* AUTHENTICATION */}
          <Sec id="auth" title="Authentication">
            <SRow label="API key" hint="Secret key — treat like a password">
              <BlurField id="apikey" value="asa_live_k8x2m9p4q1r7n3t6w5y0"
                revealed={revealed.apikey} onToggle={toggleReveal} />
              <Button variant="ghost" size="sm">Regenerate</Button>
            </SRow>
            <SRow label="Two-factor authentication"
              hint={twoFA ? "Enabled · authenticator app" : "Disabled · your account is less secure"} noBorder>
              <Tog on={twoFA} onChange={setTwoFA} />
            </SRow>
          </Sec>

          {/* WATCHLIST */}
          <Sec id="watchlist" title="Watchlist">
            <SRow label="Agent can auto-add discoveries"
              hint="High-significance names found in research are stored without asking you first">
              <Tog on={autoAdd} onChange={setAutoAdd} />
            </SRow>
            <SRow label="Propose before adding"
              hint="Show candidates in the research panel for your confirmation, regardless of significance"
              noBorder>
              <Tog on={proposeFirst} onChange={setProposeFirst} />
            </SRow>
          </Sec>

          {/* AI AGENT */}
          <Sec id="agent" title="AI Agent">
            <SRow label="Research depth"
              hint="How many sources and turns per task · change per-session from the chat bar">
              <Seg value={researchDepth} onChange={setResearchDepth} options={[
                { value:"quick",    label:"Quick"    },
                { value:"standard", label:"Standard" },
                { value:"deep",     label:"Deep"     },
              ]} />
            </SRow>
            <SRow label="Research schedule"
              hint="When the agent runs autonomous sessions without a prompt from you" noBorder>
              <Seg value={researchSchedule} onChange={setResearchSchedule} options={[
                { value:"manual", label:"Manual" },
                { value:"daily",  label:"Daily"  },
                { value:"weekly", label:"Weekly" },
              ]} />
            </SRow>
          </Sec>

          {/* NOTIFICATIONS */}
          <Sec id="notifications" title="Notifications">
            <SRow label="Alert delivery"
              hint="How the agent reaches you for price moves and high-significance findings">
              <Seg value={alertChannel} onChange={setAlertChannel} options={[
                { value:"off",   label:"Off"   },
                { value:"email", label:"Email" },
                { value:"push",  label:"Push"  },
                { value:"both",  label:"Both"  },
              ]} />
            </SRow>
            <SRow label="Price alert threshold"
              hint={`Alerts on moves beyond ±${priceAlertPct}% in a trading session`}>
              <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", color:"var(--text-dim)", minWidth:"24px" }}>2%</span>
                <input type="range" className="sett__range" min={2} max={15} step={1}
                  value={priceAlertPct} onChange={e => setPriceAlertPct(+e.target.value)} />
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", color:"var(--text-dim)", minWidth:"28px" }}>{priceAlertPct}%</span>
              </div>
            </SRow>
            <SRow label="Daily digest"
              hint="A brief summary of what the agent found, delivered each morning">
              <Tog on={dailyDigest} onChange={setDailyDigest} />
            </SRow>
            <SRow label="Weekly summary"
              hint="A deeper look at the week's research, delivered Sunday" noBorder>
              <Tog on={weeklyDigest} onChange={setWeeklyDigest} />
            </SRow>
          </Sec>

          {/* DISPLAY */}
          <Sec id="display" title="Display">
            <SRow label="Quote data refresh"
              hint="How often the watchlist price data updates in the background" noBorder>
              <Seg value={refreshInterval} onChange={setRefreshInterval} options={[
                { value:"off", label:"Off" },
                { value:"15m", label:"15m" },
                { value:"1h",  label:"1h"  },
              ]} />
            </SRow>
          </Sec>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Settings });
