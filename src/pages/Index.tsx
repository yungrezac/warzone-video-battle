
import { useState } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import Header from "@/components/Header";
import BottomNavbar from "@/components/BottomNavbar";
import VideoFeed from "@/components/VideoFeed";
import UploadVideo from "@/components/UploadVideo";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import Achievements from "@/components/Achievements";
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

  const userName = user?.first_name || user?.username || 'Роллер';
  const userBalance = userProfile?.total_points || 0;

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <Header userBalance={userBalance} userName={userName} />
        <main className="pt-14">
          {renderContent()}
        </main>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthWrapper>
  );
};

export default Index;
