/* Expressive tweak layer for the research desk.
 * Everything in this kit reads from CSS custom-property tokens, so each control here
 * rewrites a *family* of tokens at :root and the whole desk re-skins in one move —
 * no per-element pixel-pushing. Three knobs that change the feel:
 *   · Mood    — the surface + ink palette (warm paper / cool slate / dark carbon)
 *   · Accent  — the brand hue, rotated across the signal ramp + tints + selection
 *   · Edges   — the radius character (squared instrument ↔ soft paper)
 */
const { useEffect: useEffectTwk } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "paper",
  "accent": "#5b9270",
  "edges": "default"
}/*EDITMODE-END*/;

/* ---- Mood: rewrite the paper + ink + line ramps; semantics cascade from them. ---- */
const MOODS = {
  paper: {}, // ships as-is — warm off-white
  slate: {
    "--paper-0": "oklch(0.995 0.003 250)",
    "--paper-50": "oklch(0.985 0.004 250)",
    "--paper-100": "oklch(0.969 0.006 250)",
    "--paper-200": "oklch(0.945 0.008 250)",
    "--paper-300": "oklch(0.924 0.010 250)",
    "--paper-400": "oklch(0.890 0.012 250)",
    "--paper-500": "oklch(0.845 0.014 250)",
    "--paper-600": "oklch(0.780 0.014 250)",
    "--ink-1": "oklch(0.275 0.022 258)",
    "--ink-2": "oklch(0.415 0.022 258)",
    "--ink-3": "oklch(0.550 0.020 258)",
    "--ink-4": "oklch(0.670 0.016 258)",
    "--line-1": "oklch(0.905 0.010 252)",
    "--line-2": "oklch(0.850 0.014 252)",
    "--grid": "oklch(0.935 0.008 252)",
  },
  carbon: {
    "--paper-0": "oklch(0.255 0.008 75)",
    "--paper-50": "oklch(0.288 0.009 75)",
    "--paper-100": "oklch(0.212 0.008 75)",
    "--paper-200": "oklch(0.318 0.010 75)",
    "--paper-300": "oklch(0.182 0.007 75)",
    "--paper-400": "oklch(0.372 0.010 75)",
    "--paper-500": "oklch(0.442 0.012 75)",
    "--paper-600": "oklch(0.520 0.012 75)",
    "--ink-1": "oklch(0.948 0.008 80)",
    "--ink-2": "oklch(0.832 0.009 80)",
    "--ink-3": "oklch(0.672 0.010 80)",
    "--ink-4": "oklch(0.560 0.010 80)",
    "--line-1": "oklch(0.345 0.008 78)",
    "--line-2": "oklch(0.432 0.010 78)",
    "--grid": "oklch(0.300 0.006 80)",
    // On dark surfaces the quiet accent + on-accent text need to flip lighter.
    "--text-on-signal": "oklch(0.99 0.003 85)",
    "--shadow-panel": "0 1px 2px oklch(0 0 0 / 0.30), 0 2px 8px -1px oklch(0 0 0 / 0.40)",
    "--shadow-raised": "0 2px 8px oklch(0 0 0 / 0.40), 0 18px 40px -14px oklch(0 0 0 / 0.55)",
  },
};

/* ---- Accent: one hue drives the whole signal ramp (chroma/lightness held). ---- */
const ACCENT_HUE = {
  "#5b9270": 153, // Sage  — the default
  "#4d7ec9": 250, // Cobalt
  "#a07b3c": 68,  // Amber
  "#b06a52": 35,  // Terracotta
};
const ACCENT_SWATCHES = Object.keys(ACCENT_HUE);

function accentVars(hex, mood) {
  const h = ACCENT_HUE[hex] ?? 153;
  const vars = {
    "--signal-300": `oklch(0.86 0.050 ${h})`,
    "--signal-400": `oklch(0.74 0.072 ${h})`,
    "--signal-500": `oklch(0.605 0.090 ${h})`,
    "--signal-600": `oklch(0.520 0.088 ${h})`,
    "--signal-700": `oklch(0.440 0.078 ${h})`,
    "--signal-soft": `oklch(0.605 0.090 ${h} / 0.14)`,
    "--selection-bg": `oklch(0.605 0.090 ${h} / 0.18)`,
  };
  // In carbon the "quiet" text accent would be too dark on dark — lift it.
  if (mood === "carbon") vars["--accent-quiet"] = `oklch(0.760 0.072 ${h})`;
  return vars;
}

/* ---- Edges: squared instrument ↔ soft paper. ---- */
const EDGES = {
  sharp: {
    "--radius-xs": "0px", "--radius-sm": "0px", "--radius-md": "1px",
    "--radius-lg": "2px", "--radius-full": "999px",
  },
  default: {},
  soft: {
    "--radius-xs": "5px", "--radius-sm": "8px", "--radius-md": "12px",
    "--radius-lg": "18px", "--radius-full": "999px",
  },
};

function TweakLayer() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffectTwk(() => {
    const vars = {
      ...(MOODS[t.mood] || {}),
      ...accentVars(t.accent, t.mood),
      ...(EDGES[t.edges] || {}),
    };
    let el = document.getElementById("tweak-overrides");
    if (!el) {
      el = document.createElement("style");
      el.id = "tweak-overrides";
      document.head.appendChild(el);
    }
    const body = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join("");
    el.textContent = `:root{${body}}`;
  }, [t.mood, t.accent, t.edges]);

  return (
    <window.TweaksPanel title="Tweaks">
      <window.TweakSection label="Mood" />
      <window.TweakRadio
        label="Surface"
        value={t.mood}
        options={["paper", "slate", "carbon"]}
        onChange={(v) => setTweak("mood", v)}
      />
      <window.TweakSection label="Accent" />
      <window.TweakColor
        label="Brand hue"
        value={t.accent}
        options={ACCENT_SWATCHES}
        onChange={(v) => setTweak("accent", v)}
      />
      <window.TweakSection label="Edges" />
      <window.TweakRadio
        label="Radius"
        value={t.edges}
        options={["sharp", "default", "soft"]}
        onChange={(v) => setTweak("edges", v)}
      />
    </window.TweaksPanel>
  );
}

Object.assign(window, { TweakLayer });
