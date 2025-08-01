
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import AuthWrapper from "@/components/AuthWrapper";
import AchievementTracker from "@/components/AchievementTracker";
import TelegramNativeWrapper from "@/components/TelegramNativeWrapper";
import React, { Suspense, lazy } from 'react';
import PrefetchBanners from "./components/PrefetchBanners";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 500,
    },
  },
});

console.log('🚀 TRICKS App загружается...');

// Мгновенная инициализация Telegram WebApp
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  console.log('⚡ Инициализация Telegram WebApp');
  
  // Вызываем ready сразу
  tg.ready();
  
  // Расширяем приложение
  if (typeof tg.expand === 'function') {
    tg.expand();
  }
  
  // Включаем подтверждение закрытия
  tg.enableClosingConfirmation();
  
  // Настраиваем тему в зависимости от цветовой схемы
  const isDark = tg.colorScheme === 'dark';
  if (typeof tg.setHeaderColor === 'function') {
    tg.setHeaderColor(isDark ? '#1a1a1a' : '#1e40af');
  } else {
    tg.headerColor = isDark ? '#1a1a1a' : '#1e40af';
  }
  
  if (typeof tg.setBackgroundColor === 'function') {
    tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');  
  } else {
    tg.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
  }
  
  console.log('✅ Telegram WebApp готов:', {
    user: tg.initDataUnsafe?.user?.first_name || 'none',
    platform: tg.platform || 'unknown',
    version: tg.version || 'unknown',
    colorScheme: tg.colorScheme || 'light',
    viewportHeight: tg.viewportHeight || 'unknown'
  });
}

const App = () => {
  console.log('🎯 TRICKS App рендерится...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        <PrefetchBanners />
        <VideoPlaybackProvider>
          <TelegramNativeWrapper>
            <TooltipProvider>
              <Sonner />
              <AchievementTracker />
              <BrowserRouter>
                <Suspense fallback={
                  <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-xl font-bold">TRICKS</div>
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
