
import { useState, useEffect } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import BottomNavbar from "@/components/BottomNavbar";
import HomeFeed from "@/components/HomeFeed";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import MapView from "@/components/MapView";
import Achievements from "@/components/Achievements";
import CategorySelection from "@/components/CategorySelection";
import { useUserProfile } from "@/hooks/useUserProfile";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  // Проверяем, нужно ли показать выбор категории
  useEffect(() => {
    if (userProfile && !userProfile.sport_category) {
      setShowCategorySelection(true);
    }
  }, [userProfile]);

  useEffect(() => {
    const handleShowAchievements = () => {
      setActiveTab('achievements');
    };

    window.addEventListener('showAchievements', handleShowAchievements);
    return () => window.removeEventListener('showAchievements', handleShowAchievements);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed />;
      case 'map':
        return <MapView />;
      case 'achievements':
        return <Achievements />;
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return <HomeFeed />;
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <main>
          {renderContent()}
        </main>
        {activeTab !== 'achievements' && (
          <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
        )}
        {activeTab === 'achievements' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30">
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Назад в профиль
            </button>
          </div>
        )}
      </div>
      
      {/* Показываем выбор категории при первом входе */}
      {showCategorySelection && (
        <CategorySelection onComplete={() => setShowCategorySelection(false)} />
      )}
    </AuthWrapper>
  );
};

export default Index;
