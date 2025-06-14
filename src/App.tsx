
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Уменьшаем количество попыток для быстрой загрузки
      retryDelay: 500, // Уменьшаем задержку
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

console.log('🚀 App загружается мгновенно...');

// Простая инициализация Telegram WebApp если доступно
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  try {
    const tg = window.Telegram.WebApp;
    tg.ready();
    if (typeof tg.expand === 'function') {
      tg.expand();
    }
    console.log('✅ Telegram WebApp инициализирован');
  } catch (error) {
    console.log('⚠️ Telegram WebApp ошибка:', error);
  }
}

const App = () => {
  console.log('🎯 App рендерится мгновенно...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        {({ user, loading }) => {
          console.log('🏠 Приложение готово для пользователя:', user?.id || 'guest');
          
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
