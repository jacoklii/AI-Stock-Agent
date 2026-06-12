import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

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
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
