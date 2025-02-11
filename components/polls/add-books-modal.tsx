import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { BookSearch } from '@/components/books/book-search';
import { PollWithOptions } from '@/types';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';

interface AddBooksModalProps {
  groupId: string;
  poll: PollWithOptions;
  isOpen: boolean;
  onClose: () => void;
}

export function AddBooksModal({
  groupId,
  poll,
  isOpen,
  onClose,
}: AddBooksModalProps) {
  const [selectedBookIds, setSelectedBookIds] = useState<Array<string>>([]);
  const queryClient = useQueryClient();

  const { mutate: addBooks, isPending } = useMutation({
    mutationFn: async (bookIds: string[]) => {
      const response = await fetch(
        `/api/groups/${groupId}/polls/${poll.id}/books`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookIds }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add books to poll');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      toaster.create({
        title: 'Books added to poll',
        type: 'success',
        duration: 3000,
      });
      onClose();
      setSelectedBookIds([]);
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to add books',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = () => {
    if (selectedBookIds.length === 0) {
      toaster.create({
        title: 'No books selected',
        description: 'Please select at least one book to add.',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    addBooks(selectedBookIds);
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title='Add Books to Poll'
      footer={
        <Flex gap={3} justify='flex-end'>
          <Button onClick={onClose} type='button' variant='ghost' size='sm'>
            Cancel
          </Button>
          <Button
            colorPalette='purple'
            loading={isPending}
            onClick={handleSubmit}
            size='sm'
          >
            Add Books
          </Button>
        </Flex>
      }
    >
      <Stack gap={4}>
        <BookSearch
          onSelect={(bookId) => {
            setSelectedBookIds((prev) =>
              prev.includes(bookId)
                ? prev.filter((id) => id !== bookId)
                : [...prev, bookId]
            );
          }}
          selectedBookIds={selectedBookIds}
        />
        <Text color='gray.500' fontSize='sm'>
          {selectedBookIds.length} book{selectedBookIds.length === 1 ? '' : 's'}{' '}
          selected
        </Text>
      </Stack>
    </DialogWrapper>
  );
}
