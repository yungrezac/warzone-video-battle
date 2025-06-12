
import React, { useState } from 'react';
import VideoFeed from '@/components/VideoFeed';
import TopUsers from '@/components/TopUsers';
import Market from '@/components/Market';
import Profile from '@/components/Profile';
import Tournaments from '@/components/Tournaments';
import BottomNavbar from '@/components/BottomNavbar';
import Header from '@/components/Header';
import UploadModal from '@/components/UploadModal';
import Achievements from '@/components/Achievements';
import ComingSoonModal from '@/components/ComingSoonModal';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  React.useEffect(() => {
    const handleShowAchievements = () => {
      setIsAchievementsOpen(true);
    };

    const handleShowComingSoon = () => {
      setIsComingSoonOpen(true);
    };

    window.addEventListener('showAchievements', handleShowAchievements);
    window.addEventListener('showComingSoon', handleShowComingSoon);
    return () => {
      window.removeEventListener('showAchievements', handleShowAchievements);
      window.removeEventListener('showComingSoon', handleShowComingSoon);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <VideoFeed />;
      case 'top':
        return <TopUsers />;
      case 'tournaments':
        return <Tournaments />;
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
        onUploadClick={() => setIsUploadModalOpen(true)}
        activeTab={activeTab}
      />
      
      <main className="pt-14">
        {renderContent()}
      </main>

      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      <Achievements
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      <ComingSoonModal 
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
      />
    </div>
  );
};

export default Index;
