import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Flex, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { PollWithOptions } from '@/types';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';

interface EditPollModalProps {
  groupId: string;
  poll: PollWithOptions;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPollModal({
  groupId,
  poll,
  isOpen,
  onClose,
}: EditPollModalProps) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || '');
  const [startDate, setStartDate] = useState(
    poll.startDate
      ? new Date(poll.startDate)
          .toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
          })
          .replace(' ', 'T')
      : ''
  );
  const [endDate, setEndDate] = useState(
    poll.endDate
      ? new Date(poll.endDate)
          .toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
          })
          .replace(' ', 'T')
      : ''
  );

  const queryClient = useQueryClient();

  const { mutate: updatePoll, isPending } = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await fetch(`/api/groups/${groupId}/polls/${poll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update poll');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['polls', groupId],
        refetchType: 'all',
      });
      toaster.create({
        title: 'Poll updated',
        type: 'success',
        duration: 3000,
      });
      onClose();
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to update poll',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toaster.create({
        title: 'Missing required fields',
        description: 'Please enter a title for the poll.',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    // Only validate dates if both are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        toaster.create({
          title: 'Invalid dates',
          description: 'End date must be after start date',
          type: 'error',
          duration: 3000,
        });
        return;
      }
    }

    updatePoll({
      title,
      description: description || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title='Edit Poll'
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
            Save Changes
          </Button>
        </Flex>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
      >
        <Stack gap={4}>
          <Stack>
            <Text mb={2}>Title *</Text>
            <Input
              name='title'
              onChange={(e) => setTitle(e.target.value)}
              required
              size='lg'
              value={title}
            />
          </Stack>

          <Stack>
            <Text mb={2}>Description</Text>
            <Textarea
              name='description'
              onChange={(e) => setDescription(e.target.value)}
              size='lg'
              value={description}
            />
          </Stack>

          <Stack>
            <Text mb={2}>Start Date</Text>
            <Input
              name='startDate'
              onChange={(e) => setStartDate(e.target.value)}
              size='lg'
              type='datetime-local'
              value={startDate}
            />
          </Stack>

          <Stack>
            <Text mb={2}>End Date (required for activation)</Text>
            <Input
              name='endDate'
              onChange={(e) => setEndDate(e.target.value)}
              size='lg'
              type='datetime-local'
              value={endDate}
            />
          </Stack>
        </Stack>
      </form>
    </DialogWrapper>
  );
}
