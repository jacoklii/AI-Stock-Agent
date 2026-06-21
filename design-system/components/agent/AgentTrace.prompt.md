The transparency log — what makes this a partner you can trust rather than a black box. A vertical trace of the agent's steps, each showing the tool used, source domains, input/output tokens, timestamp, and any cross-platform reuse ("reused from the Jun 14 brief"). Done steps get a check, the active step pulses, pending steps sit dim.

```jsx
<AgentTrace steps={[
  { label: "Reconstructed context from your watchlist", tool: "memory.read", reuse: "Watchlist", inTok: "1.2k", outTok: "0.1k", at: "09:14:02", status: "done" },
  { label: "Searched advanced-packaging capex guidance", tool: "web.search", sources: ["reuters.com", "bloomberg.com"], inTok: "8.4k", outTok: "0.6k", at: "09:14:20", status: "done" },
  { label: "Reading 6 sources", tool: "web.fetch", sources: ["ft.com", "+4"], inTok: "12.1k", outTok: "0.3k", at: "09:14:41", status: "active" },
  { label: "Draft findings & significance score", status: "pending" },
]} />
```

Every field is optional except `label`. Feed it the real agent run; it's the same data the `WorkingStrip` summarizes in one line.
