// One typed hook per endpoint. Poll intervals follow the view contract: the agent surfaces
// (activity, open research) poll fast; knowledge surfaces refresh on focus.
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, nullOn404, unwrap } from "./client";

// --- Agent state ----------------------------------------------------------------

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => unwrap(await api.GET("/agent/activity")),
    refetchInterval: 15_000,
  });
}

export function useBudget() {
  return useQuery({
    queryKey: ["budget"],
    queryFn: async () => unwrap(await api.GET("/budget")),
    refetchInterval: 60_000,
  });
}

// --- Digest / home ----------------------------------------------------------------

export function useDigest() {
  return useQuery({
    queryKey: ["digest"],
    queryFn: async () => unwrap(await api.GET("/digest/latest")),
    staleTime: 60_000,
  });
}

// --- Research sessions --------------------------------------------------------------

export function useResearchList(status?: "open" | "closed", limit = 20) {
  return useQuery({
    queryKey: ["research", { status: status ?? "all", limit }],
    queryFn: async () =>
      unwrap(
        await api.GET("/research", {
          params: { query: { ...(status ? { status } : {}), limit } },
        }),
      ),
    refetchInterval: 30_000,
  });
}

export function useResearchDetail(stateId: number) {
  return useQuery({
    queryKey: ["research", stateId],
    queryFn: async () =>
      unwrap(
        await api.GET("/research/{state_id}", {
          params: { path: { state_id: stateId } },
        }),
      ),
    refetchInterval: 15_000,
  });
}

export function useOpenResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { topic: string; company_id?: number | null }) =>
      unwrap(await api.POST("/research", { body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["research"] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useCloseResearch(stateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promote: boolean) =>
      unwrap(
        await api.POST("/research/{state_id}/close", {
          params: { path: { state_id: stateId } },
          body: { promote },
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["research"] }),
  });
}

export function useRedirectResearch(stateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { topic?: string | null; current_task?: string | null }) =>
      unwrap(
        await api.POST("/research/{state_id}/redirect", {
          params: { path: { state_id: stateId } },
          body,
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["research"] }),
  });
}

// --- Chat -----------------------------------------------------------------------------

export function useChatMessages() {
  return useQuery({
    queryKey: ["chat"],
    queryFn: async () => unwrap(await api.GET("/chat/messages")),
    refetchInterval: 30_000,
  });
}

/** Mutation key for chat sends — lets any view observe in-flight asks (Chat renders them as
 * pending bubbles) and lets the cache-level handler in App.tsx invalidate after unmount. */
export const CHAT_SEND_KEY = "chat-send";

export function useSendChat() {
  return useMutation({
    mutationKey: [CHAT_SEND_KEY],
    mutationFn: async (body: { content: string; company_id?: number | null }) =>
      unwrap(await api.POST("/chat/messages", { body })),
  });
}

// --- Brief ------------------------------------------------------------------------------

export function useBriefState() {
  return useQuery({
    queryKey: ["brief", "state"],
    queryFn: async () => unwrap(await api.GET("/brief/state")),
    refetchInterval: 60_000,
  });
}

export function useBriefLatest() {
  return useQuery({
    queryKey: ["brief", "latest"],
    queryFn: async () => unwrap(await api.GET("/brief/latest")),
    staleTime: 60_000,
  });
}

export function useRunBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/brief/run")),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brief"] });
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

// --- Inbox -------------------------------------------------------------------------------

export function useInbox(limit = 50) {
  return useQuery({
    queryKey: ["inbox", limit],
    queryFn: async () =>
      unwrap(await api.GET("/inbox", { params: { query: { limit } } })),
    refetchInterval: 60_000,
  });
}

export function useInboxAction(action: "read" | "dismiss") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) =>
      unwrap(
        await api.POST(
          action === "read"
            ? "/inbox/{notification_id}/read"
            : "/inbox/{notification_id}/dismiss",
          { params: { path: { notification_id: notificationId } } },
        ),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

// --- Industries / companies -----------------------------------------------------------------

export function useIndustries() {
  return useQuery({
    queryKey: ["industries"],
    queryFn: async () => unwrap(await api.GET("/industries")),
  });
}

export function useIndustryDetail(industryId: number) {
  return useQuery({
    queryKey: ["industries", industryId],
    queryFn: async () =>
      unwrap(
        await api.GET("/industries/{industry_id}", {
          params: { path: { industry_id: industryId } },
        }),
      ),
  });
}

export function useFlagIndustry(industryId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (flagged: boolean) =>
      unwrap(
        await api.POST("/industries/{industry_id}/flag", {
          params: { path: { industry_id: industryId } },
          body: { flagged },
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["industries"] }),
  });
}

export function useCompanies(tier?: "watchlist") {
  return useQuery({
    queryKey: ["companies", tier ?? "all"],
    queryFn: async () =>
      unwrap(
        await api.GET("/companies", {
          params: { query: tier ? { tier } : {} },
        }),
      ),
  });
}

export function useCompanyDetail(companyId: number) {
  return useQuery({
    queryKey: ["companies", "detail", companyId],
    queryFn: async () =>
      unwrap(
        await api.GET("/companies/{company_id}", {
          params: { path: { company_id: companyId } },
        }),
      ),
  });
}

export function useWatchlistAction(companyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: "promote" | "demote") =>
      unwrap(
        await api.POST("/companies/{company_id}/watchlist", {
          params: { path: { company_id: companyId } },
          body: { action },
        }),
      ),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

// --- Preferences ------------------------------------------------------------------------------

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => nullOn404(api.GET("/preferences").then(unwrap)),
  });
}

export function useUpdateBriefUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbols: string[]) =>
      unwrap(await api.PUT("/preferences/brief-user", { body: { symbols } })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (weeklyTokenBudget: number | null) =>
      unwrap(
        await api.PUT("/preferences/budget", {
          body: { weekly_token_budget: weeklyTokenBudget },
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["preferences"] });
      void qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useUpdateChannels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (channels: {
      email?: string | null;
      imessage?: string | null;
      whatsapp?: string | null;
      digest_channels?: string[];
      brief_channels?: string[];
    }) => unwrap(await api.PUT("/preferences/channels", { body: channels })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
}
