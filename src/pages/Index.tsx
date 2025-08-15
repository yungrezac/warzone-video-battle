
import { useState, useEffect } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import BottomNavbar from "@/components/BottomNavbar";
import VideoFeed from "@/components/VideoFeed";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import TopUsers from "@/components/TopUsers";
import Tournaments from "@/components/Tournaments";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Trophy, Zap } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [homeSubTab, setHomeSubTab] = useState('feed');
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="pb-16">
            <Tabs value={homeSubTab} onValueChange={setHomeSubTab} className="w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 z-20">
                <TabsList className="grid w-full grid-cols-3 rounded-none h-12 bg-white">
                  <TabsTrigger 
                    value="feed" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Лента</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="top" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Топ</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tournaments" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Турниры</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="feed" className="mt-0">
                <VideoFeed />
              </TabsContent>
              
              <TabsContent value="top" className="mt-0">
                <TopUsers />
              </TabsContent>
              
              <TabsContent value="tournaments" className="mt-0">
                <Tournaments />
              </TabsContent>
            </Tabs>
          </div>
        );
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return (
          <div className="pb-16">
            <Tabs value="feed" className="w-full">
              <TabsContent value="feed" className="mt-0">
                <VideoFeed />
              </TabsContent>
            </Tabs>
          </div>
        );
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <main>
          {renderContent()}
        </main>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthWrapper>
  );
};

export default Index;
