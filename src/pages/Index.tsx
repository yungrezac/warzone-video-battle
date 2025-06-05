
import { useState } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import BottomNavbar from "@/components/BottomNavbar";
import VideoFeed from "@/components/VideoFeed";
import UploadVideo from "@/components/UploadVideo";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import Achievements from "@/components/Achievements";
import AchievementNotificationManager from "@/components/AchievementNotificationManager";
import { useUserProfile } from "@/hooks/useUserProfile";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <VideoFeed />;
      case 'upload':
        return <UploadVideo />;
      case 'achievements':
        return <Achievements />;
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return <VideoFeed />;
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <main>
          {renderContent()}
        </main>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
        <AchievementNotificationManager />
      </div>
    </AuthWrapper>
  );
};

export default Index;
