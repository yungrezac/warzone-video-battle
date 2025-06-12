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
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

console.log('🚀 App компонент загружается...');
console.log('🌐 Window объект:', typeof window !== 'undefined' ? 'доступен' : 'недоступен');
console.log('📱 Telegram объект:', typeof window !== 'undefined' && window.Telegram ? 'найден' : 'не найден');

if (typeof window !== 'undefined') {
  console.log('🔍 Проверяем Telegram WebApp...');
  if (window.Telegram) {
    console.log('✅ window.Telegram существует');
    if (window.Telegram.WebApp) {
      console.log('✅ window.Telegram.WebApp существует');
      console.log('📊 WebApp данные:', {
        initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
        готов: typeof window.Telegram.WebApp.ready === 'function',
        версия: (window.Telegram.WebApp as any).version || 'неизвестно'
      });
      
      // Принудительно вызываем ready() если еще не вызван
      if (typeof window.Telegram.WebApp.ready === 'function') {
        try {
          window.Telegram.WebApp.ready();
          console.log('✅ WebApp.ready() вызван принудительно');
        } catch (error) {
          console.log('⚠️ Ошибка при вызове WebApp.ready():', error);
        }
      }
    } else {
      console.log('❌ window.Telegram.WebApp НЕ существует');
    }
  } else {
    console.log('❌ window.Telegram НЕ существует');
  }
}

const App = () => {
  console.log('🎯 App рендерится...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        {({ user, loading }) => {
          console.log('🔄 App render состояние:', { 
            user: user ? `${user.id} (${user.username})` : 'null', 
            loading,
            timestamp: new Date().toISOString()
          });
          
          // Убираем экран загрузки - показываем приложение сразу
          console.log('🏠 Показываем основное приложение для пользователя:', user?.id || 'гостевой пользователь');
          
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
