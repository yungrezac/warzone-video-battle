
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import AchievementTracker from "@/components/AchievementTracker";
import TelegramNativeWrapper from "@/components/TelegramNativeWrapper";
import InstantLoader from "@/components/InstantLoader";
import React, { Suspense, lazy } from 'react';

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Оптимизированный QueryClient для быстрой работы
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 300,
      staleTime: 30000, // 30 секунд
      gcTime: 5 * 60 * 1000, // 5 минут (заменил cacheTime на gcTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
      retryDelay: 300,
    },
  },
});

console.log('🚀 TRICKS App загружается с оптимизацией...');

// Мгновенная инициализация Telegram WebApp (без изменений)
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  console.log('⚡ Мгновенная инициализация Telegram WebApp');
  
  tg.ready();
  
  if (typeof tg.expand === 'function') {
    tg.expand();
  }
  
  tg.enableClosingConfirmation();
  
  const isDark = tg.colorScheme === 'dark';
  if (typeof tg.setHeaderColor === 'function') {
    tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
  }
  
  if (typeof tg.setBackgroundColor === 'function') {
    tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');  
  }
  
  console.log('✅ Telegram WebApp мгновенно готов');
}

const App = () => {
  console.log('🎯 TRICKS App рендерится с оптимизацией...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        <InstantLoader />
        <VideoPlaybackProvider>
          <TelegramNativeWrapper>
            <TooltipProvider>
              <Sonner />
              <AchievementTracker />
              <BrowserRouter>
                <Suspense fallback={
                  <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-xl font-bold animate-pulse">TRICKS</div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </TelegramNativeWrapper>
        </VideoPlaybackProvider>
      </AuthWrapper>
    </QueryClientProvider>
  );
};

export default App;
