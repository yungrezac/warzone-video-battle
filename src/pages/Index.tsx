
import { useState, useEffect } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { useAuth } from "@/components/AuthWrapper";
import BottomNavbar from "@/components/BottomNavbar";
import VideoFeed from "@/components/VideoFeed";
import PostFeed from "@/components/PostFeed";
import Profile from "@/components/Profile";
import Market from "@/components/Market";
import TopUsers from "@/components/TopUsers";
import Tournaments from "@/components/Tournaments";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [feedType, setFeedType] = useState<'videos' | 'posts'>('videos');
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <Tabs value={feedType} onValueChange={(value) => setFeedType(value as 'videos' | 'posts')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="videos">Видео</TabsTrigger>
                  <TabsTrigger value="posts">Посты</TabsTrigger>
                </TabsList>
                <TabsContent value="videos">
                  <VideoFeed />
                </TabsContent>
                <TabsContent value="posts">
                  <PostFeed />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );
      case 'top':
        return <TopUsers />;
      case 'tournaments':
        return <Tournaments />;
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <Tabs value={feedType} onValueChange={(value) => setFeedType(value as 'videos' | 'posts')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="videos">Видео</TabsTrigger>
                  <TabsTrigger value="posts">Посты</TabsTrigger>
                </TabsList>
                <TabsContent value="videos">
                  <VideoFeed />
                </TabsContent>
                <TabsContent value="posts">
                  <PostFeed />
                </TabsContent>
              </Tabs>
            </div>
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
