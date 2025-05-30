"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from '@/lib/auth-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface DeleteConversationButtonProps {
  conversationId: string;
  onDeleted?: () => void;
}

export function DeleteConversationButton({ 
  conversationId, 
  onDeleted 
}: DeleteConversationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!conversationId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      toast({
        title: "✓ Conversation Deleted",
        description: "The conversation has been successfully removed",
        duration: 3000,
        className: "border-green-200 bg-green-50 text-green-900",
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Navigate back to conversations list or call the callback
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/conversation');
      }
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete conversation",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <TrashIcon className="h-4 w-4 mr-2" />
        )}
        Delete Conversation
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all concepts associated with it. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 