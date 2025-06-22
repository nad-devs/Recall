import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Autocomplete } from '@/components/ui/autocomplete';
import { TagInput } from '@/components/ui/TagInput';
import { Concept } from '@/lib/types/conversation';
import { Loader2 } from 'lucide-react';

interface SimpleCategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conceptId: string, newCategory: string, subcategories: string[]) => Promise<void>;
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
  const [category, setCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (concept) {
      const parts = concept.category.split(' > ');
      setCategory(parts[0] || '');
      setSubcategories(parts.length > 1 ? parts.slice(1) : []);
    }
  }, [concept]);

  if (!concept) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(concept.id, category, subcategories);
    setIsSaving(false);
    onClose();
  };
  
  const categoryOptions = existingCategories.map(cat => ({ value: cat, label: cat }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Change the category and subcategories for "{concept.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Autocomplete
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              placeholder="Choose or create a category..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategories</Label>
            <TagInput
              tags={subcategories}
              setTags={setSubcategories}
              placeholder="Add subcategories..."
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