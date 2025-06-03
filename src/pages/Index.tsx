
import React, { useState } from 'react';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import TelegramAuth from '@/components/TelegramAuth';
import Header from '@/components/Header';
import BottomNavbar from '@/components/BottomNavbar';
import VideoFeed from '@/components/VideoFeed';
import UploadVideo from '@/components/UploadVideo';
import Market from '@/components/Market';
import Profile from '@/components/Profile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const { user, loading } = useAuth();
  const { data: userProfile } = useUserProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return <TelegramAuth />;
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'feed':
        return <VideoFeed />;
      case 'upload':
        return <UploadVideo />;
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return <VideoFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userBalance={userProfile?.total_points || 0} 
        userName={userProfile?.username || userProfile?.telegram_username || 'Пользователь'} 
      />
      
      <main className="pt-0">
        {renderActiveComponent()}
      </main>
      
      <BottomNavbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

const Index = () => {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
};

export default Index;
