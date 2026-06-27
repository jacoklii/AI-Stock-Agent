# DESIGN

## Goal:

This is to be a meaningful, informative, useful, and actually usable platform for investors (hosted on cloud server and launch own terminal). Not hype. It has to actually bring in information and show value.

A live feed of news & events, and a research agent to keep the investor updated on the stock market, and have “surveillance” of what’s happening in the world that affects the stock market.

Keep the user/investor updated on the stock market, global events and geopolitics, macroeconomics, and industry trends to help them know why the stock market or a part of it is moving in a certain direction.
Like a Palantir style surveillance system, it watches whats happening in the world that might affect the stock market to keep the investor proactive rather than reactive on the market.

## Mental Model
Think of it like a researcher. It researches intensively in bounded sessions, then rests after finding what it needs. While it rests from deep research, automation keeps running in the background — scraping & ingesting news, updating the user, etc. The AI is in the automation to summarize findings from tools, and if something material surfaces during that automation, the researcher is back up to run deep research. Otherwise the researcher waits for a schedule or a direct request. The automation never stops; the researcher only works when there's something worth working on.

### AI-Specific
Deep research, repetitive workflows + tasks, pattern recognition ascross the information to deep research macro movement, industries, trends, and stocks.

### Human-Specific
Complex reasoning & game theory, judgement, speculation, valuation, and decisions. Directed research, decide what to act on, and catch what the AI got wrong. Buy/Sell/Holds.

## Information the Investor Needs
This is information that the AI or web scraper looks for. It doesn’t need to find everything, this is a list of what it should look out for in news, reports/articles, and events on the web. To find everything it possibly can.

**Geopolitics** - geopolitical movement and events, conflicts, statements and recent news announcements, elections, supply chain bottle necks, wars, trade disputes, etc. Anything that affects global trade. (Example: “Iran took control of strait of hormuz, US got involved and…”so on. Then the AI thinks, “I better research more of this”, looks for more details, looks for affected industries, economics, financials, stocks, etc. Then the AI informs to the investor the findings/information (strait blocking and US involved might affect X industry.))

**Macroeconomics** - Financials and specific economies (mainly US) and economic growth, central banking policies, inflation metrics, interest rates, employment data, manufacturing/services indexes, bonds, yield curves, currencies, commodities, etc

**Industry trends** - Acquisitions, revenue, industry giants, new technology, specific ties to geopolitics

**General market movement** - users most interested stocks and general market and the price 
movements, and what’s happening for those stocks, reasons about price movement, influences, not opinions

## Definitions
**Breadth** — continuous automation: news ingest, noise filtering, summarization. Runs always, including while the agent is at deep research rest.
**Deep research** — bounded agent sessions: on-demand, on-schedule, or triggered when breadth surfaces converging signal. Between sessions the agent rests; breadth automation continues and can call it back if something material appears.
**Brief** — a short snapshot pushed to iMessage/WhatsApp. Runs morning/midday/close. Includes 5-7 mega-cap/intrested stocks from the user and there prices at the bottom
**Revelance** — a fast ingest filter. Answers: does this event clear the bar? Above threshold it's kept; below threshold it's dropped and never stored.
Coverage tier — controls what the system fetches and scores per company. See Coverage Tiers table.

## AI Aspects
- **Researches** — industries, sectors, supply chains, macroeconomics, geopolitics, specific companies. Watchlist is downstream of research, not its boundary.
- **Summarize** — synthesizes patterns from data, filters noise. Output is observations + supporting data + reasoning. Never conclusions.
- **Updates** — surfaces findings the agent made, organized by industry / sector / macro. Article URLs are primary; AI synthesis is orientation alongside.

## Coverage Tiers
 
Every company has a `coverage_tier` that controls what the system fetches and scores for it.
 
| Tier               | News ingest | Financials | Scoring |
|--------------------|-------------|------------|---------|
| `watchlist`        | Yes         | Yes        | Yes     |
| `industry_critical`| Yes         | Yes        | Yes     |
| `discovered`       | Yes         | No         | No      |
| `archived`         | No          | No         | No      |
 
`discovered` companies surface through research but haven't been promoted. `archived` companies are excluded from all active coverage.

---
 
# ARCHITECTURE 
 
## Requirements
 
**Functional**
- Ingest/scrape news + market data continuously;
- Run deep research sessions: user-triggered, scheduled, or wakeup from signal convergence in breadth.
- Maintain memory across sessions so the agents state can resume.
- Chat is the primary direction interface.
- Surface findings via brief update and detailed digest.
- Cite sources on every output. Article URLs are first-class.

**Non-functional**
- Single user, always-on for breadth automation; deep sessions bounded.
- Cost-bounded by a weekly token budget; agent self-paces.
- Provider-swappable (one wrapper per external dependency).
- Traceable (every output ties back to its inputs).
- Knowledge-layer only; no buy/sell/hold or valuation calls.
- Failed jobs visible and re-runnable.

### Core Application Components

**AI Agent Researcher**
    - deep research topics, mainly user interests, requests, and important events or trends, etc.
    - It also summarize findings from web scraper’s findings to the platform as a summary, and articles beneath it.
    - Updates the user via email or text. Summaries on events, market movement/price movement, summary on industries/trends/user interest.

**Web scraper** - to find thousands of pieces of info. articles, news, events, reports, announcements, etc that’s on the geopolitics, macroeconomics, industry trends, and all the topics I said before that the investor needs, and it finds info like the examples below.

**Real-time/near-real-time data** - to keep the information present and recent
    - For stocks, markets, finances, etc.
    - Or if new statements/announcements  that are important [example like Donald trump announcing an agreement between them and iran] 

**Surveillance on World** - for keeping the investor aware
    - Using news and events from web and posting it on this platform

**Update** - the user on the interface for detailed information, or update via email and text for more important information/a summary of what’s on the interface.
    - Email - is for briefings
    - Text - is for most important updates (like top watchlist movement and a companies trends [like Nvidia made an acquisition), or user interested industry trends, and biggest geopolitical events [like the US/Iran update], etc) and alerts, user requests to the AI agent

**Automation** - to run updates and continuous web scraping. The only place that AI is in the loop is to summarize text and web scraping results.

### Core Technical Components

**Real-time**
Real-time, or near real-time (one minute-change) on stock prices, market prices, yields, bonds, indexes. Anything that’s continuously changing needs this kind of update.

**AI agent**
Research — researches are triggered. Throughout the day 24/7
Summaries & writing — most important to synthesize information across the web research, web scraper, news and events, etc.
Working memory — the AI needs state or context over research, it needs memory so information isn’t lost.

**Web scraper**
The web scraper finds information the investor needs, see what’s recent, what may be important as context. It doesn’t store the entire article or report, it semantically finds information on the topic, to then be used or summarized by the AI, or used to do further research.It’s also used to find those news  and events.
Schedule based and runs every 10 minutes, the gap between sessions. The AI only summarizes or runs when there’s a lot of information or something that is semantically important, not every session.

**Semantics**
Found across the platform for the AI’s research, for the web scraper to find information.It’s just to find what’s similar and relevant between the market, the web, the platform/investor, and interests.“Important information the investor needs” section applies to this

**Signals & triggers**
Deep research triggers — significance thresholds based on web scraper findings and then asks “will this affect the market?”. Plus any user requests.
The “Updates” on the platform — generated on the AI’s deep research, includes ai summary on web scraper findings, and stock market update. So its first generation is in the morning before market open, then it’s triggered, not scheduled. Past updates are visible on the platform for up to 7 days. Then it disappears but is stored/remembered as a brief memory, not a full paragraph.

**Automation**
Runs throughout the whole day, 24/7

AI in the loop — Only to summarize findings (small cheap models), until deep research trigger is activated or user request via platform or text (for big advanced models)
Schedule & notifications— A market open briefing via email (alerts and information found during nighttime goes here), for any context on info and the stock market— Alerts on big events (like stronger tensions between nations, or announcements, industry trends, etc) or big stock market movement via text any time during the day— Updates on stock market, research, news, and events (the information the investor needs) via email and platform anytime during the day

**News and events**
articles, reports, announcements, live channels on the topic X (like a reporter is talking about AI and the strait of hormuz blockage, or update on the stock market), and any context the investor needs to understand the stock market at this time.
Goes straight to email to the platform, but two different versions. The email is shorter, a summary/briefing generated from the AI and lists news articles to read (found by the scraper), or full research in email briefing format. The platform has it all, and more in detail. News and events are across the platform. Mainly in the news tab, under industries, under Updates geopolitics, events, industries, everywhere where news and events give context to the text on the platform. It lists most significant pieces of info to that section.

## Constraints
 
**Hard**
- AI never recommends buy/sell/hold or makes valuation calls.
- AI reads freely (DB tools + web + providers). AI writes only through specific paths; no raw SQL on production data.
- Every analysis, pattern, and finding cites sources.
- Cache holds fetched content with TTL; persistent storage holds summaries and findings only — never whole transcripts or article bodies.
- Embedding model is fixed; changes are explicit backfills.
- `company_id` for joins, never ticker.
- All timestamps UTC; sectors and industries from controlled vocabularies.

**Soft**
- One Postgres + pgvector.
- Weekly token budget; agent throttles to fit.
- Deep sessions bounded by wall-clock + token cap.
- Cache-first on web reads; bypass when freshness matters.
- Findings-first before external fetches (check what the agent already knows).
- One agent until role divergence emerges.
- New external dependency behind a wrapper before first use.

## Change & Separation
 
- External APIs behind internal wrappers.
- Daily prices / quarterly financials / news / state — separate cadences, separate tables.
- **Cache vs. persistent storage are separate.** Cache holds full content with TTL; storage holds extracted summaries and findings only.
- **State (the agents mutable working memory) vs. analysis (durable record) are separate.**
- **Brief update vs. detailed digest are separate delivery shapes** with separate templates and triggers.
- Tools are pure functions; the agent composes them but doesn't own them.
- UI talks only to FastAPI; never directly to Postgres.
 
## Interface:
A very thin header on the top only for time and date. No logos.

**Menu Bar** that opens/closes the left panel
- Research — research sessions
- Watchlist and industries — opens the top stocks and prices, underneath watchlist is user interested industries for what the industry is and current state
- Chat interface to speak to the agent
- News and events top news and events broadly

- Settings — only one that opens up to a different view, not side panel

**Left Panel**
Anything in the left panel opens or expands in the left panel
Chat request opens in the agents panel

**Right Panel** (agents panel)
- Strictly for agent state, weekly token budget, research and findings. Can be opened or collapsed
- UI here is good to see what the AI agent is doing, current ai metrics (tokens, turns, tools, etc). 
- AI research opens up here

**Middle Panel**
- This is where the state of the world/overview of the research, web scraper findings, main news and events go. Industry trends, geopolitics, and the “Information the investor needs”.
- Usually text, bulleted lists, images (news reports, live streaming news or clips), symbols prices and price changes, minimal UI and styling. UI here is mainly to organize, not to hype up the platform with meaningless boarders.
- Anything can be clicked on and expand to the full information, open to research, or open up to a source or the web.