
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import TelegramAuth from "@/components/TelegramAuth";
import AchievementTracker from "@/components/AchievementTracker";
import Index from "./pages/Index";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthWrapper>
      {({ user, loading }) => {
        console.log('App render - user:', user, 'loading:', loading);
        
        if (loading) {
          console.log('Показываем TelegramAuth из-за loading');
          return <TelegramAuth />;
        }

        if (!user) {
          console.log('Показываем TelegramAuth из-за отсутствия пользователя');
          return <TelegramAuth />;
        }

        console.log('Показываем основное приложение для пользователя:', user.id);
        
        return (
          <VideoPlaybackProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AchievementTracker />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
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
