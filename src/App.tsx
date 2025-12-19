import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WidgetView from "./features/widget/WidgetView";

const queryClient = new QueryClient();

// Sprawdź czy to okno widgetu (via hash routing)
const isWidgetView = () => {
  const hash = window.location.hash;
  // Obsługuje: #/widget, #widget, /#/widget
  return hash.includes('widget');
};

const App = () => {
  // Jeśli to widok widgetu, renderuj tylko widget
  if (isWidgetView()) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <WidgetView />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Standardowy routing dla głównej aplikacji
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/widget" element={<WidgetView />} />
            <Route path="*" element={<Index />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
