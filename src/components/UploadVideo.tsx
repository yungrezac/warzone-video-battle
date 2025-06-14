
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullScreenUploadModal from '@/components/FullScreenUploadModal';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from 'sonner';
import FullScreenLoader from './FullScreenLoader';

const UploadVideo: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      toast.error('Войдите в систему для загрузки трюков');
      navigate('/');
      return;
    }
    // Открываем модальное окно, как только компонент будет готов
    setIsUploadModalOpen(true);
  }, [user, isLoading, navigate]);

  const handleClose = () => {
    setIsUploadModalOpen(false);
    // После закрытия модального окна (успешной загрузки или отмены) возвращаемся на главную
    navigate('/');
  };

  if (isLoading) {
    return <FullScreenLoader message="Проверяем авторизацию..." />;
  }
  
  // Этот компонент теперь просто "хост" для модального окна.
  // Само окно вызовет выбор файла автоматически.
  return (
    <FullScreenUploadModal isOpen={isUploadModalOpen} onClose={handleClose} />
  );
};

export default UploadVideo;
