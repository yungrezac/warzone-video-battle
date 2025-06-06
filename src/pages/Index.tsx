
import { useState } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import NewBottomNavbar from "@/components/NewBottomNavbar";
import NewVideoFeed from "@/components/NewVideoFeed";
import UploadVideo from "@/components/UploadVideo";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import MapPage from "@/components/MapPage";
import UsersPage from "@/components/UsersPage";
import CommunityPage from "@/components/CommunityPage";
import { useUserProfile } from "@/hooks/useUserProfile";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <NewVideoFeed />;
      case 'map':
        return <MapPage />;
      case 'users':
        return <UsersPage />;
      case 'community':
        return <CommunityPage />;
      case 'profile':
        return <Profile />;
      case 'upload':
        return <UploadVideo />;
      case 'market':
        return <Market />;
      default:
        return <NewVideoFeed />;
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <main>
          {renderContent()}
        </main>
        <NewBottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthWrapper>
  );
};

export default Index;
