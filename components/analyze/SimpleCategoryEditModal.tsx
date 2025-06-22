import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { Concept } from '@/lib/types/conversation';
import { Loader2 } from 'lucide-react';

interface SimpleCategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conceptId: string, newCategory: string, newSubcategory?: string) => Promise<void>;
  concept: Concept | null;
  existingCategories: string[];
}

export function SimpleCategoryEditModal({
  isOpen,
  onClose,
  onSave,
  concept,
  existingCategories,
}: SimpleCategoryEditModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (concept) {
      const parts = concept.category.split(' > ');
      setNewCategory(parts[0] || '');
      setNewSubcategory(parts.length > 1 ? parts.slice(1).join(' > ') : '');
    }
  }, [concept]);

  if (!concept) return null;

  const handleSave = async () => {
    setIsSaving(true);
    let finalCategory = newCategory;
    if (newSubcategory.trim()) {
      finalCategory = `${newCategory} > ${newSubcategory.trim()}`;
    }
    await onSave(concept.id, finalCategory);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Change the category for "{concept.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select id="category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="col-span-3">
              <SelectOption value="">Select a category</SelectOption>
              {existingCategories.map(cat => (
                <SelectOption key={cat} value={cat}>{cat}</SelectOption>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subcategory" className="text-right">
              Subcategory
            </Label>
            <Input
              id="subcategory"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className="col-span-3"
              placeholder="(Optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleCategoryEditModal; 