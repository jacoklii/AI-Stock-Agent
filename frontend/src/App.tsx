import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiError } from "./api/client";
import { CHAT_SEND_KEY } from "./api/queries";
import { Desk } from "./components/Desk";

const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // 4xx is a definitive answer (not found, bad request) — retrying only delays the
      // error state; transient/server failures get one retry.
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status < 500 ? false : failureCount < 1,
    },
  },
  // Chat sends can outlive the surface that fired them (ask from a company panel, switch surface);
  // cache-level invalidation runs even after that component unmounts.
  mutationCache: new MutationCache({
    onSettled: (_data, _error, _variables, _context, mutation) => {
      if (mutation.options.mutationKey?.[0] === CHAT_SEND_KEY) {
        void queryClient.invalidateQueries({ queryKey: ["chat"] });
        void queryClient.invalidateQueries({ queryKey: ["budget"] });
      }
    },
  }),
});

/** One unified terminal — the Desk never tab-switches; Settings is the only separate full view,
 *  reached from the rail. (PROJECT.md §5.) */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Desk />
    </QueryClientProvider>
  );
}
