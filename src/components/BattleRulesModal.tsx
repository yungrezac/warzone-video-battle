
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info, Sword, Clock, Trophy, Users } from 'lucide-react';

interface BattleRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BattleRulesModal: React.FC<BattleRulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sword className="w-6 h-6 text-blue-600" />
            Правила видеобатлов
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Участие</h3>
                <p className="text-sm text-gray-600">
                  Зарегистрируйтесь на батл до его начала. Минимум 2 участника для старта.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Правила игры</h3>
                <p className="text-sm text-gray-600">
                  Повторите трюк из референсного видео и добавьте свой элемент. У вас есть ограниченное время на подготовку ответа.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Sword className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Система СКЕЙТ</h3>
                <p className="text-sm text-gray-600">
                  За каждую неудачную попытку получаете букву. Набрав все буквы слова - выбываете из батла.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Победа</h3>
                <p className="text-sm text-gray-600">
                  Последний оставшийся участник становится победителем и получает призовые баллы.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Важно знать:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Видео должно быть качественным и четким</li>
              <li>• Соблюдайте временные рамки</li>
              <li>• Будьте готовы к честной конкуренции</li>
              <li>• Уважайте других участников</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BattleRulesModal;
