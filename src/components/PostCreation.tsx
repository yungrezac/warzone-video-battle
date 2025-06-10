
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Send } from 'lucide-react';

interface PostCreationProps {
  onPostCreated: () => void;
  onCancel: () => void;
}

const PostCreation: React.FC<PostCreationProps> = ({ onPostCreated, onCancel }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    // Здесь будет логика создания поста
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация запроса
    setIsLoading(false);
    onPostCreated();
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Создать пост</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Что у вас нового?
            </Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Поделитесь своими мыслями..."
              className="w-full h-24 p-3 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {image && (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild className="border-2 hover:bg-blue-50 hover:border-blue-300">
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Фото
                  </span>
                </Button>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-2 hover:bg-gray-50"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Публикация...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Опубликовать
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostCreation;
