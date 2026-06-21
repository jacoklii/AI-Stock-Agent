// TodayFeed — the main/center view. "Today's update" hero (the full current research of the day)
// followed by today's live surface: articles, reports, filings and clips the agent used or that
// the semantic scraper matched. Each card is ephemeral — research it to keep it, else it clears.
// Exports window.TodayUpdate and window.NewsFeed.

const { Button: TFButton } = window.AIStockAgentDesignSystem_ea6e23;

const TODAY_CSS = `
  .tf{ max-width:880px; margin:0 auto; padding:26px 28px 60px; }

  /* ---- Today's update hero ---- */
  .tu{ border-bottom:1px solid var(--border-strong); padding-bottom:26px; margin-bottom:26px; }
  .tu__eyebrow{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .tu__kicker{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:var(--accent-quiet); }
  .tu__dot{ width:5px; height:5px; border-radius:999px; background:var(--accent); }
  .tu__date{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); letter-spacing:.04em; }
  .tu__gen{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; }
  .tu__headline{ font-family:var(--font-display); font-size:34px; font-weight:700; letter-spacing:-.015em;
    line-height:1.1; color:var(--text-strong); margin:0 0 16px; text-wrap:balance; }
  .tu__lede{ font-family:var(--font-serif); font-size:18px; line-height:1.55; color:var(--text-body); margin:0 0 22px; max-width:680px; text-wrap:pretty; }
  .tu__threads{ display:flex; flex-direction:column; gap:0; }
  .tu__thread{ display:grid; grid-template-columns:26px 1fr; gap:14px; padding:14px 0; border-top:1px solid var(--border-default); }
  .tu__thread:first-child{ border-top:0; }
  .tu__tnum{ font-family:var(--font-mono); font-size:11px; color:var(--accent-quiet); padding-top:3px; font-variant-numeric:tabular-nums; }
  .tu__ttext{ font-family:var(--font-serif); font-size:15px; line-height:1.55; color:var(--text-muted); margin:0; text-wrap:pretty; }

  /* ---- News feed ---- */
  .nf__head{ display:flex; align-items:baseline; gap:12px; margin:0 0 16px; }
  .nf__h{ font-family:var(--font-display); font-size:17px; font-weight:700; color:var(--text-strong); }
  .nf__sub{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
  .nf__note{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; display:flex; align-items:center; gap:6px; }
  .nf{ display:flex; flex-direction:column; gap:16px; }

  .nc{ display:grid; grid-template-columns:172px 1fr; gap:18px; padding:16px; background:var(--surface-panel);
    border:1px solid var(--border-default); border-radius:var(--radius-md);
    transition:border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out); }
  .nc:hover{ border-color:var(--border-strong); }
  .nc--saved{ border-color:color-mix(in oklch, var(--up-500), transparent 55%); }

  .nc__media{ position:relative; aspect-ratio:4/3; border:1px solid var(--border-default); border-radius:var(--radius-sm); overflow:hidden;
    background:repeating-linear-gradient(135deg, var(--surface-inset), var(--surface-inset) 7px, var(--surface-raised) 7px, var(--surface-raised) 14px);
    display:flex; align-items:flex-end; }
  .nc__medialabel{ font-family:var(--font-mono); font-size:9px; color:var(--text-muted); letter-spacing:.04em;
    background:color-mix(in oklch, var(--bg-app), transparent 8%); padding:4px 6px; margin:7px; border-radius:var(--radius-xs); position:relative; z-index:1; }
  .nc__play{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--text-muted); }
  .nc__playdot{ width:38px; height:38px; border-radius:999px; background:color-mix(in oklch, var(--bg-app), transparent 8%);
    border:1px solid var(--border-strong); display:flex; align-items:center; justify-content:center; color:var(--text-strong); }

  .nc__body{ display:flex; flex-direction:column; min-width:0; }
  .nc__tags{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:9px; }
  .nc__rel{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; }
  .nc__rel--used{ color:var(--accent-quiet); }
  .nc__rel--related{ color:var(--text-muted); }
  .nc__kind{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .nc__topic{ font-family:var(--font-display); font-size:17px; font-weight:600; line-height:1.25; color:var(--text-strong);
    margin:0 0 8px; text-decoration:none; display:inline-flex; align-items:flex-start; gap:7px; text-wrap:pretty; }
  .nc__topic:hover{ color:var(--accent-quiet); }
  .nc__topic svg{ flex:none; margin-top:4px; opacity:.5; }
  .nc__topic:hover svg{ opacity:1; }
  .nc__meta{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .nc__metaicon{ display:inline-flex; align-items:center; gap:5px; }
  .nc__metaicon svg{ stroke:var(--text-dim); }
  .nc__sep{ opacity:.4; }
  .nc__excerpt{ font-family:var(--font-serif); font-size:14px; line-height:1.55; color:var(--text-muted); margin:0 0 14px; text-wrap:pretty; }
  .nc__foot{ display:flex; align-items:center; gap:10px; margin-top:auto; }
  .nc__src{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .nc__actions{ margin-left:auto; display:flex; align-items:center; gap:8px; }
  .nc__expire{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); display:inline-flex; align-items:center; gap:5px; }
  .nc__saved{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--up-500); display:inline-flex; align-items:center; gap:5px; }
`;

function TodayUpdate({ today }) {
  window.useStyle("kit-today", TODAY_CSS);
  return (
    <div className="tu">
      <div className="tu__eyebrow">
        <span className="tu__dot" />
        <span className="tu__kicker">Today's update</span>
        <span className="tu__date">{today.date}</span>
        <span className="tu__gen">generated {today.generatedAt}</span>
      </div>
      <h1 className="tu__headline">{today.headline}</h1>
      <p className="tu__lede">{today.body}</p>
      <div className="tu__threads">
        {(today.threads || []).map((t, i) => (
          <div className="tu__thread" key={i}>
            <span className="tu__tnum">{String(i + 1).padStart(2, "0")}</span>
            <p className="tu__ttext">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item, saved, onResearch, onSave }) {
  return (
    <div className={`nc${saved ? " nc--saved" : ""}`}>
      <div className="nc__media">
        {item.media === "video" && (
          <span className="nc__play"><span className="nc__playdot"><window.Icon name="play" size={15} /></span></span>
        )}
        <span className="nc__medialabel">{item.mediaLabel}</span>
      </div>
      <div className="nc__body">
        <div className="nc__tags">
          <span className={`nc__rel nc__rel--${item.relevance}`}>
            {item.relevance === "used" ? "used in today's research" : "semantically related"}
          </span>
          <span className="nc__kind">{item.kind}</span>
        </div>
        <a className="nc__topic" href={item.url} target="_blank" rel="noopener noreferrer">
          {item.topic}<window.Icon name="external-link" size={14} />
        </a>
        <div className="nc__meta">
          <span className="nc__metaicon"><window.Icon name="layers" size={11} />{item.industry}</span>
          <span className="nc__sep">·</span>
          <span className="nc__metaicon"><window.Icon name="globe" size={11} />{item.macro}</span>
        </div>
        <p className="nc__excerpt">{item.excerpt}</p>
        <div className="nc__foot">
          <span className="nc__src">{item.source} · {item.at}</span>
          <div className="nc__actions">
            {saved ? (
              <span className="nc__saved"><window.Icon name="check" size={12} />saved to database</span>
            ) : (
              <span className="nc__expire"><window.Icon name="clock" size={11} />clears at end of day</span>
            )}
            <TFButton variant="ghost" size="sm" onClick={() => onResearch(item)}>Research</TFButton>
            <TFButton variant={saved ? "secondary" : "primary"} size="sm" onClick={() => onSave(item.id)}>
              {saved ? "Saved" : "Save"}
            </TFButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsFeed({ news, saved, onResearch, onSave }) {
  const usedCount = news.filter((n) => n.relevance === "used").length;
  return (
    <div>
      <div className="nf__head">
        <span className="nf__h">Today's surface</span>
        <span className="nf__sub">{news.length} items · {usedCount} used by the agent</span>
        <span className="nf__note"><window.Icon name="clock" size={11} />not stored unless you research it</span>
      </div>
      <div className="nf">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} saved={!!saved[item.id]} onResearch={onResearch} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}

function TodayMain({ today, news, saved, onResearch, onSave }) {
  window.useStyle("kit-today", TODAY_CSS);
  return (
    <div className="tf">
      <TodayUpdate today={today} />
      <NewsFeed news={news} saved={saved} onResearch={onResearch} onSave={onSave} />
    </div>
  );
}

Object.assign(window, { TodayUpdate, NewsFeed, NewsCard, TodayMain });
