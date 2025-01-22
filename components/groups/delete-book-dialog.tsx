import { Button } from '@/components/ui/button';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { useBookMutations } from '@/hooks/useBookMutations';
import { Flex, Text } from '@chakra-ui/react';

interface DeleteBookDialogProps {
  bookId: string;
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  placement?: 'top' | 'bottom' | 'center' | undefined;
  title: string;
}

export function DeleteBookDialog({
  bookId,
  groupId,
  isOpen,
  onClose,
  placement = 'center',
  title,
}: DeleteBookDialogProps) {
  const { deleteMutation } = useBookMutations(bookId, groupId);

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <DialogWrapper
      footer={
        <Flex gap={3} pt={4}>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette='red'
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Flex>
      }
      isOpen={isOpen}
      onClose={onClose}
      placement={placement}
      role='alertdialog'
      title='Delete Book'
    >
      <Text fontSize='md' my={4}>
        Are you sure you want to delete &quot;{title}&quot;? This action cannot
        be undone.
      </Text>
    </DialogWrapper>
  );
}
