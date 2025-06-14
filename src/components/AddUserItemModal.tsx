
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateUserMarketItem, CreateUserMarketItemPayload } from '@/hooks/useUserMarketItems';
import { Loader2 } from 'lucide-react';

interface AddUserItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddUserItemModal: React.FC<AddUserItemModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState<'rollers' | 'bmx' | 'skate' | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');

  const createItemMutation = useCreateUserMarketItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !targetAudience || !productUrl) return;

    const payload: CreateUserMarketItemPayload = {
      name,
      description,
      price: parseFloat(price),
      category,
      target_audience: targetAudience,
      image_url: imageUrl,
      product_url: productUrl,
    };

    await createItemMutation.mutateAsync(payload, {
      onSuccess: () => {
        onClose();
        setName('');
        setDescription('');
        setPrice('');
        setCategory('');
        setTargetAudience('');
        setImageUrl('');
        setProductUrl('');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить свой товар</DialogTitle>
          <DialogDescription>
            Заполните форму, чтобы разместить товар в маркете.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Название *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Цена (RUB) *</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="targetAudience">Для кого *</Label>
            <Select onValueChange={(v) => setTargetAudience(v as any)} value={targetAudience}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите аудиторию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rollers">Роллеры</SelectItem>
                <SelectItem value="bmx">BMX</SelectItem>
                <SelectItem value="skate">Скейтборд</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Категория</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Например, Запчасти"/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">URL изображения</Label>
            <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../image.png" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="productUrl">URL товара *</Label>
            <Input id="productUrl" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} required placeholder="https://your-shop.com/item"/>
          </div>
          <Button type="submit" disabled={createItemMutation.isPending}>
            {createItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Добавить товар
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserItemModal;
