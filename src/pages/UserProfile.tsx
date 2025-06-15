
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullScreenUserProfileModal from '@/components/FullScreenUserProfileModal';
import { Loader2 } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    // When the modal is closed, navigate back to the home page.
    navigate(-1);
  };

  if (!userId) {
    // This part is for safety, if somehow the route is hit without a userId.
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);

    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm">
        <FullScreenUserProfileModal
          isOpen={true} // It's always open when this page is rendered
          onClose={handleClose}
          userId={userId}
        />
    </div>
  );
};

export default UserProfile;
