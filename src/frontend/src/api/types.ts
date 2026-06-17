// Aliases over the generated OpenAPI schema — the single source of wire types.
import type { components } from "./schema";

type S = components["schemas"];

export type ArticleOut = S["ArticleOut"];
export type RelatedArticleOut = S["RelatedArticleOut"];
export type RelatedSessionOut = S["RelatedSessionOut"];
export type ActivityOut = S["ActivityOut"];
export type BudgetOut = S["BudgetOut"];
export type BriefStateOut = S["BriefStateOut"];
export type BriefLatestOut = S["BriefLatestOut"];
export type ChannelsOut = S["ChannelsOut"];
export type ChatMessageOut = S["ChatMessageOut"];
export type CompanyDetail = S["CompanyDetail"];
export type CompanyListItem = S["CompanyListItem"];
export type DigestView = S["DigestView"];
export type InboxItem = S["InboxItem"];
export type IndustryListItem = S["IndustryListItem"];
export type IndustryView = S["IndustryView"];
export type PreferencesOut = S["PreferencesOut"];
export type ResearchSessionOut = S["ResearchSessionOut"];
export type ResearchSessionDetail = S["ResearchSessionDetail"];
export type ProgressOut = S["ProgressOut"];
export type TaskOut = S["TaskOut"];
export type TokenUsageOut = S["TokenUsageOut"];
