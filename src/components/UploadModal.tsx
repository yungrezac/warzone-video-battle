
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import UploadVideo from './UploadVideo';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <UploadVideo onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
