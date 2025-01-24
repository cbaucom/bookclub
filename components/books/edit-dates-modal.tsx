import { useState, useEffect } from 'react';
import { Box, Input } from '@chakra-ui/react';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';

interface EditDatesModalProps {
  bookId: string;
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

async function updateBookDates(
  groupId: string,
  bookId: string,
  data: { startDate?: string; endDate?: string }
) {
  const response = await fetch(`/api/groups/${groupId}/books/${bookId}/dates`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update book dates');
  }

  return response.json();
}

export function EditDatesModal({
  bookId,
  groupId,
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
}: EditDatesModalProps) {
  const [startDate, setStartDate] = useState(
    initialStartDate
      ? new Date(initialStartDate).toISOString().split('T')[0]
      : ''
  );
  const [endDate, setEndDate] = useState(
    initialEndDate ? new Date(initialEndDate).toISOString().split('T')[0] : ''
  );

  useEffect(() => {
    setStartDate(
      initialStartDate
        ? new Date(initialStartDate).toISOString().split('T')[0]
        : ''
    );
    setEndDate(
      initialEndDate ? new Date(initialEndDate).toISOString().split('T')[0] : ''
    );
  }, [initialStartDate, initialEndDate]);

  const queryClient = useQueryClient();

  const { mutate: updateDates, isPending } = useMutation({
    mutationFn: (data: { startDate?: string; endDate?: string }) =>
      updateBookDates(groupId, bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', groupId] });
      queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId, groupId] });
      onClose();
      toaster.create({
        title: 'Book dates updated',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to update book dates',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = () => {
    updateDates({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title='Edit Book Dates'
      footer={
        <>
          <Button
            colorPalette='purple'
            onClick={handleSubmit}
            disabled={isPending}
            size='sm'
          >
            {isPending ? 'Updating...' : 'Update Dates'}
          </Button>
          <Button variant='ghost' onClick={onClose} size='sm'>
            Cancel
          </Button>
        </>
      }
    >
      <Box>
        <Field label='Start Date'>
          <Input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label='End Date'>
          <Input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
      </Box>
    </DialogWrapper>
  );
}
