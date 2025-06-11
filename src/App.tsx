
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import TelegramAuth from "@/components/TelegramAuth";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthWrapper>
      {({ user, loading }) => {
        if (loading) {
          return <TelegramAuth />;
        }

        if (!user) {
          return <TelegramAuth />;
        }

        return (
          <VideoPlaybackProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </VideoPlaybackProvider>
        );
      }}
    </AuthWrapper>
  </QueryClientProvider>
);

export default App;
