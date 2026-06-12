import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { ApiError } from "./api/client";
import { CHAT_SEND_KEY } from "./api/queries";
import { NavShell } from "./components/NavShell";
import { Brief } from "./views/Brief";
import { Chat } from "./views/Chat";
import { CompanyDetail } from "./views/CompanyDetail";
import { Home } from "./views/Home";
import { Inbox } from "./views/Inbox";
import { Industries } from "./views/Industries";
import { IndustryDetail } from "./views/IndustryDetail";
import { Research } from "./views/Research";
import { ResearchDetail } from "./views/ResearchDetail";
import { Settings } from "./views/Settings";

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
  // Chat sends can outlive the view that fired them (ask from a company page, navigate away);
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

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-2 pt-12 text-center">
      <h1 className="text-lg font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-neutral-500">
        Nothing lives at this address.{" "}
        <Link to="/" className="font-medium text-blue-700 hover:underline">
          Back to Home
        </Link>
      </p>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<NavShell />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="research" element={<Research />} />
            <Route path="research/:stateId" element={<ResearchDetail />} />
            <Route path="industries" element={<Industries />} />
            <Route path="industries/:industryId" element={<IndustryDetail />} />
            <Route path="companies/:companyId" element={<CompanyDetail />} />
            <Route path="brief" element={<Brief />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
