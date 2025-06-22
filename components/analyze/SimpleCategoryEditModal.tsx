import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Autocomplete } from '@/components/ui/autocomplete';
import { TagInput } from '@/components/ui/TagInput';
import { Concept } from '@/lib/types/conversation';
import { Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth-utils';

interface SimpleCategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conceptId: string, newCategory: string, subcategories: string[]) => Promise<void>;
  concept: Concept | null;
  structuredCategories: { [key: string]: string[] };
}

export function SimpleCategoryEditModal({
  isOpen,
  onClose,
  onSave,
  concept,
  structuredCategories,
}: SimpleCategoryEditModalProps) {
  const [category, setCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<{ [key: string]: string[] }>({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories from database when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDynamicCategories();
    }
  }, [isOpen]);

  const fetchDynamicCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/categories', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const categories = await response.json();
        // Convert hierarchical structure to flat structure for easier use
        const structured: { [key: string]: string[] } = {};
        
        categories.forEach((category: any) => {
          structured[category.name] = category.children?.map((child: any) => child.name) || [];
        });
        
        setDynamicCategories(structured);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to static categories if fetch fails
      setDynamicCategories(structuredCategories);
    } finally {
      setLoadingCategories(false);
    }
  };

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
    try {
      const fullCategory = [category, ...subcategories].join(' > ');
      await onSave(concept.id, fullCategory, subcategories);
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Use dynamic categories if available, fallback to static
  const categoriesData = Object.keys(dynamicCategories).length > 0 ? dynamicCategories : structuredCategories;
  const mainCategories = Object.keys(categoriesData);
  const categoryOptions = mainCategories.map(cat => ({ value: cat, label: cat }));
  const subcategorySuggestions = categoriesData[category] || [];

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
              disabled={loadingCategories}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategories</Label>
            <TagInput
              tags={subcategories}
              setTags={setSubcategories}
              placeholder="Add subcategories..."
              suggestions={subcategorySuggestions}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving || loadingCategories}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || loadingCategories}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleCategoryEditModal; 