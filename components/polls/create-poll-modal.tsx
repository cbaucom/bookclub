import { Button, Input, Stack, Textarea, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { CreatePollRequest } from '@/types';
import { BookSearch } from '@/components/books/book-search';
import { toaster } from '@/components/ui/toaster';
import { PollStatus, VotingMethod } from '@prisma/client';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogCloseTrigger,
  DialogBackdrop,
} from '@/components/ui/dialog';

interface CreatePollModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePollModal({
  groupId,
  isOpen,
  onClose,
}: CreatePollModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>(
    VotingMethod.UPVOTE_DOWNVOTE
  );
  const [maxPoints, setMaxPoints] = useState('10');
  const [selectedBookIds, setSelectedBookIds] = useState<Array<string>>([]);

  const queryClient = useQueryClient();

  const { mutate: createPoll, isPending } = useMutation({
    mutationFn: async (data: CreatePollRequest) => {
      const response = await fetch(`/api/groups/${groupId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      toaster.create({
        title: 'Poll created',
        type: 'success',
        duration: 3000,
      });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to create poll',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setVotingMethod(VotingMethod.UPVOTE_DOWNVOTE);
    setMaxPoints('10');
    setSelectedBookIds([]);
  };

  const handleSubmit = (e: FormEvent) => {
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

      if (start < new Date()) {
        toaster.create({
          title: 'Invalid start date',
          description: 'Start date must be in the future',
          type: 'error',
          duration: 3000,
        });
        return;
      }
    }

    createPoll({
      title,
      description,
      groupId,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      votingMethod,
      maxPoints:
        votingMethod === VotingMethod.WEIGHTED
          ? parseInt(maxPoints)
          : undefined,
      bookIds: selectedBookIds.length > 0 ? selectedBookIds : undefined,
      status: PollStatus.PENDING,
    });
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>Create Poll</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <form id='create-poll-form' onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Stack>
                <Text mb={2}>Title *</Text>
                <Input
                  name='title'
                  placeholder='What should we read next?'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  size='lg'
                />
              </Stack>

              <Stack>
                <Text mb={2}>Description</Text>
                <Textarea
                  name='description'
                  placeholder='Add some context about this poll...'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size='lg'
                />
              </Stack>

              <Stack>
                <Text mb={2}>Start Date (required for activation)</Text>
                <Input
                  name='startDate'
                  type='datetime-local'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size='lg'
                />
              </Stack>

              <Stack>
                <Text mb={2}>End Date (required for activation)</Text>
                <Input
                  name='endDate'
                  type='datetime-local'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size='lg'
                />
              </Stack>

              <Stack>
                <Text mb={2}>Voting Method *</Text>
                <select
                  name='votingMethod'
                  value={votingMethod}
                  onChange={(e) =>
                    setVotingMethod(e.target.value as VotingMethod)
                  }
                  style={{
                    padding: '0.5rem',
                    width: '100%',
                    borderWidth: '1px',
                    borderRadius: '0.375rem',
                  }}
                  required
                >
                  <option value={VotingMethod.UPVOTE_DOWNVOTE}>
                    Upvote/Downvote
                  </option>
                  <option value={VotingMethod.WEIGHTED}>Weighted Points</option>
                  {/* <option value={VotingMethod.RANKED_CHOICE}>
                    Ranked Choice
                  </option>
                  <option value={VotingMethod.BRACKET}>
                    Bracket Tournament
                  </option> */}
                </select>
                <Text fontSize='sm' color='gray.500'>
                  {votingMethod === VotingMethod.UPVOTE_DOWNVOTE &&
                    'Members can upvote or downvote each book once'}
                  {votingMethod === VotingMethod.WEIGHTED &&
                    'Members can distribute points across books'}
                  {votingMethod === VotingMethod.RANKED_CHOICE &&
                    'Members rank books in order of preference'}
                  {votingMethod === VotingMethod.BRACKET &&
                    'Books compete in head-to-head matchups. Requires exactly 2, 4, 8, or 16 books to activate.'}
                </Text>
              </Stack>

              {votingMethod === VotingMethod.WEIGHTED && (
                <Stack>
                  <Text mb={2}>Maximum Points per Member</Text>
                  <Input
                    name='maxPoints'
                    type='number'
                    min='1'
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                    size='lg'
                  />
                  <Text fontSize='sm' color='gray.500'>
                    Each member can distribute up to this many points across all
                    books
                  </Text>
                </Stack>
              )}

              <Stack>
                <Text mb={2}>
                  Book Options (at least 2 required for activation)
                </Text>
                <BookSearch
                  onSelect={(bookId: string) =>
                    setSelectedBookIds((prev) =>
                      prev.includes(bookId)
                        ? prev.filter((id) => id !== bookId)
                        : [...prev, bookId]
                    )
                  }
                  selectedBookIds={selectedBookIds}
                />
                <Text fontSize='sm' color='gray.500'>
                  Selected books: {selectedBookIds.length}
                </Text>
              </Stack>

              <Text fontSize='sm' color='gray.500'>
                * Required fields
              </Text>
              <Text fontSize='sm' color='gray.500'>
                Poll will be created in draft status. You can add more books and
                activate it later.
              </Text>
            </Stack>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette='purple'
            type='submit'
            form='create-poll-form'
            loading={isPending}
            ml={3}
          >
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
