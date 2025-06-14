
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import AchievementTracker from "@/components/AchievementTracker";
import React, { Suspense, lazy } from 'react';
import FullScreenLoader from "./components/FullScreenLoader";

const Index = lazy(() => import("./pages/Index"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 500,
      staleTime: 5 * 60 * 1000,
    },
  },
});

console.log('🚀 App загружается мгновенно...');

// Мгновенная инициализация Telegram WebApp
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  console.log('⚡ Мгновенная инициализация Telegram WebApp');
  
  // Вызываем ready сразу
  tg.ready();
  
  // Расширяем приложение
  if (typeof tg.expand === 'function') {
    tg.expand();
  }
  
  console.log('✅ Telegram WebApp готов мгновенно:', {
    user: tg.initDataUnsafe?.user?.first_name || 'none',
    platform: tg.platform || 'unknown'
  });
}

const App = () => {
  console.log('🎯 App рендерится мгновенно...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        <VideoPlaybackProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AchievementTracker />
            <BrowserRouter>
              <Suspense fallback={<FullScreenLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </VideoPlaybackProvider>
      </AuthWrapper>
    </QueryClientProvider>
  );
};

export default App;
