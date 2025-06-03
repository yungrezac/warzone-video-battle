
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavbar from '@/components/BottomNavbar';
import VideoFeed from '@/components/VideoFeed';
import UploadVideo from '@/components/UploadVideo';
import Market from '@/components/Market';
import Profile from '@/components/Profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [userBalance] = useState(856);
  const [userName] = useState('ProGamer123');

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
      <Header userBalance={userBalance} userName={userName} />
      
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

export default Index;
