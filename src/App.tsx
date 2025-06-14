
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import AchievementTracker from "@/components/AchievementTracker";
import Index from "./pages/Index";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

// Оптимизированная конфигурация QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

console.log('🚀 Оптимизированное приложение загружается...');

// Мгновенная инициализация Telegram WebApp
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  console.log('⚡ Мгновенная инициализация Telegram WebApp');
  
  tg.ready();
  
  if (typeof tg.expand === 'function') {
    tg.expand();
  }
  
  console.log('✅ Telegram WebApp готов:', {
    user: tg.initDataUnsafe?.user?.first_name || 'none',
    platform: tg.platform || 'unknown'
  });
}

const App = () => {
  console.log('🎯 Оптимизированное приложение рендерится...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        {({ user, loading }) => {
          console.log('🏠 Оптимизированное приложение готово для пользователя:', user?.first_name || 'guest');
          
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
};

export default App;
