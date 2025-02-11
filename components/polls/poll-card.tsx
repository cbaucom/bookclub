import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  IconButton,
  Progress,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PollWithOptions } from '@/types';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUser } from '@clerk/nextjs';
import { PollStatus } from '@prisma/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, formatDistanceToNow } from 'date-fns';
import { FaEllipsisV } from 'react-icons/fa';
import { toaster } from '@/components/ui/toaster';
import {
  MenuRoot,
  MenuItem,
  MenuTrigger,
  MenuContent,
} from '@/components/ui/menu';
import React, { useState } from 'react';
import { EditPollModal } from './edit-poll-modal';
import { AddBooksModal } from './add-books-modal';

interface PollCardProps {
  groupId: string;
  poll: PollWithOptions;
}

interface SortableItemProps {
  id: string;
  title: string;
  author: string;
  rank: number;
}

function SortableItem({ id, title, author, rank }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      bg='whiteAlpha.50'
      borderRadius='lg'
      p={4}
    >
      <Flex align='center' justify='space-between'>
        <Box>
          <Text fontWeight='bold'>{title}</Text>
          <Text color='gray.500' fontSize='sm'>
            {author}
          </Text>
        </Box>
        <Text fontSize='lg' fontWeight='bold' opacity={0.5}>
          #{rank}
        </Text>
      </Flex>
    </Box>
  );
}

// Helper function to get next valid bracket size
function getNextValidBracketSize(currentSize: number): number {
  const validSizes = [2, 4, 8, 16];
  return (
    validSizes.find((size) => size > currentSize) ||
    validSizes[validSizes.length - 1]
  );
}

export function PollCard({ groupId, poll }: PollCardProps) {
  const { isAdmin } = useIsAdmin(groupId);
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddBooksModalOpen, setIsAddBooksModalOpen] = useState(false);

  const now = new Date();
  const startDate = new Date(poll.startDate);
  const endDate = new Date(poll.endDate);

  const isPending = now < startDate;
  const isExpired = now >= endDate;

  // Auto-complete expired polls
  React.useEffect(() => {
    if (isAdmin && poll.status === PollStatus.ACTIVE && isExpired) {
      updatePoll({ status: PollStatus.COMPLETED });
    }
  }, [isAdmin, poll.status, isExpired]);

  // Auto-activate pending polls
  React.useEffect(() => {
    if (isAdmin && poll.status === PollStatus.PENDING && !isPending) {
      updatePoll({ status: PollStatus.ACTIVE });
    }
  }, [isAdmin, poll.status, isPending]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { mutate: vote } = useMutation({
    mutationFn: async ({
      pollOptionId,
      value,
    }: {
      pollOptionId: string;
      value: number;
    }) => {
      console.log('[POLL_CARD] Sending vote request:', { pollOptionId, value });
      const response = await fetch(
        `/api/groups/${groupId}/polls/${poll.id}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollOptionId, value }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      console.log('[POLL_CARD] Vote response:', data);
      return data;
    },
    onSuccess: () => {
      // Force a refetch to ensure we get fresh data
      queryClient.invalidateQueries({
        queryKey: ['polls', groupId],
        refetchType: 'all',
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to vote',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const { mutate: updatePoll } = useMutation({
    mutationFn: async (data: {
      status?: PollStatus;
      startDate?: string;
      endDate?: string;
      title?: string;
      description?: string;
    }) => {
      // If we're updating status, use PATCH, otherwise use PUT
      const method = data.status ? 'PATCH' : 'PUT';
      const body = data.status
        ? { status: data.status }
        : {
            ...data,
            startDate: data.startDate
              ? new Date(data.startDate).toISOString()
              : undefined,
            endDate: data.endDate
              ? new Date(data.endDate).toISOString()
              : undefined,
          };

      const response = await fetch(`/api/groups/${groupId}/polls/${poll.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
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

  const { mutate: deletePoll } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/polls/${poll.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete poll');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      toaster.create({
        title: 'Poll deleted',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Failed to delete poll',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleUpvoteDownvote = async (pollOptionId: string) => {
    if (!user?.id) return;

    const option = poll.options.find((option) => option.id === pollOptionId);
    const myVote = option?.votes.find((v) => v.user.clerkId === user.id);

    vote({
      pollOptionId,
      value: myVote ? 0 : 1,
    });
  };

  const [weightedVotes, setWeightedVotes] = React.useState<
    Record<string, number>
  >({});

  // Only initialize once when the component mounts or when user changes
  React.useEffect(() => {
    if (poll.votingMethod === 'WEIGHTED' && user) {
      const initialVotes: Record<string, number> = {};
      poll.options.forEach((option) => {
        const userVote =
          option.votes.find((v) => v.user.clerkId === user.id)?.value ?? 0;
        initialVotes[option.id] = userVote;
      });
      console.log('[DEBUG] Initial votes:', initialVotes);
      setWeightedVotes(initialVotes);
    }
  }, [user?.id]); // Only depend on user.id, not poll.options

  const handleWeightedVote = (pollOptionId: string, value: number) => {
    const maxPoints = poll.maxPoints ?? 10;

    // Calculate new total excluding the current option
    const otherPointsUsed = Object.entries(weightedVotes)
      .filter(([id]) => id !== pollOptionId)
      .reduce((sum, [, val]) => sum + val, 0);

    // Check if this new value would exceed max points
    if (otherPointsUsed + value > maxPoints) {
      toaster.create({
        title: 'Too many points',
        description: `You can only allocate ${maxPoints} points total`,
        type: 'error',
        duration: 3000,
      });
      return;
    }

    // Update local state first
    setWeightedVotes((prev) => ({
      ...prev,
      [pollOptionId]: value,
    }));

    // Then update server
    vote({ pollOptionId, value });
  };

  const handleRankedChoice = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = poll.options.findIndex((o) => o.id === active.id);
    const newIndex = poll.options.findIndex((o) => o.id === over.id);

    // Update all affected options with new ranks
    const updates = poll.options
      .sort((a, b) => {
        const aVotes = a.votes[0]?.value || Number.MAX_SAFE_INTEGER;
        const bVotes = b.votes[0]?.value || Number.MAX_SAFE_INTEGER;
        return aVotes - bVotes;
      })
      .map((option, index) => {
        if (index === oldIndex) {
          return vote({
            pollOptionId: option.id,
            value: newIndex + 1,
          });
        }
        if (
          index >= Math.min(oldIndex, newIndex) &&
          index <= Math.max(oldIndex, newIndex)
        ) {
          const newRank = oldIndex > newIndex ? index + 2 : index + 1;
          return vote({ pollOptionId: option.id, value: newRank });
        }
        return Promise.resolve();
      });

    Promise.all(updates);
  };

  const handleBracketVote = (pollOptionId: string) => {
    return vote({ pollOptionId, value: 1 });
  };

  const getVotingInterface = () => {
    switch (poll.votingMethod) {
      case 'UPVOTE_DOWNVOTE':
        return (
          <Stack gap={4}>
            {poll.options.map((option) => {
              const hasVoted = option.votes.some(
                (v) => v.user.clerkId === user?.id
              );

              return (
                <Box key={option.id} bg='whiteAlpha.50' borderRadius='lg' p={4}>
                  <Flex align='center' justify='space-between'>
                    <Box>
                      <Text fontWeight='bold'>{option.book.title}</Text>
                      <Text color='gray.500' fontSize='sm'>
                        {option.book.author}
                      </Text>
                    </Box>
                    <Flex align='center' gap={2}>
                      {poll.status === PollStatus.COMPLETED ? (
                        <Text
                          color={
                            option.votes.length > 0 ? 'green.500' : 'gray.500'
                          }
                          fontWeight='bold'
                        >
                          {option.votes.length} vote
                          {option.votes.length === 1 ? '' : 's'}
                        </Text>
                      ) : (
                        hasVoted && (
                          <Text color='green.500' fontSize='sm'>
                            Voted
                          </Text>
                        )
                      )}
                      <Button
                        onClick={() => handleUpvoteDownvote(option.id)}
                        size='sm'
                        variant={hasVoted ? 'solid' : 'ghost'}
                        colorPalette={hasVoted ? 'green' : 'gray'}
                        disabled={poll.status !== PollStatus.ACTIVE}
                      >
                        👍
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
          </Stack>
        );

      case 'WEIGHTED': {
        const maxPoints = poll.maxPoints ?? 10;
        const totalPointsUsed = Object.values(weightedVotes).reduce(
          (sum, val) => sum + val,
          0
        );
        const pointsRemaining = maxPoints - totalPointsUsed;

        return (
          <Stack gap={4}>
            <Text color='gray.500' fontSize='sm'>
              Points remaining:{' '}
              <Text as='span' color='purple.500' fontSize='sm'>
                {pointsRemaining}
              </Text>
            </Text>
            {poll.options.map((option) => {
              const userVote = weightedVotes[option.id] ?? 0;

              // Only count votes from other users if poll is completed
              const otherVotes =
                poll.status === PollStatus.COMPLETED
                  ? option.votes
                      .filter((v) => v.user.clerkId !== user?.id)
                      .reduce((sum, v) => sum + v.value, 0)
                  : 0;

              // Total is other users' votes (if completed) plus our local state
              const totalPoints = otherVotes + userVote;

              // Calculate max allowed points for this option
              const maxAllowedPoints = Math.min(
                userVote + pointsRemaining,
                maxPoints
              );

              return (
                <Box key={option.id} bg='whiteAlpha.50' borderRadius='lg' p={4}>
                  <Flex align='center' justify='space-between'>
                    <Box>
                      <Text fontWeight='bold'>{option.book.title}</Text>
                      <Text color='gray.500' fontSize='sm'>
                        {option.book.author}
                      </Text>
                    </Box>
                    <Flex align='center' gap={2}>
                      {poll.status === PollStatus.COMPLETED ? (
                        <Text fontWeight='bold'>{totalPoints} points</Text>
                      ) : userVote > 0 ? (
                        <Text color='purple.500' fontSize='sm'>
                          {userVote} points
                        </Text>
                      ) : null}
                      <select
                        value={userVote}
                        style={{ width: '60px', padding: '2px' }}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          handleWeightedVote(option.id, newValue);
                        }}
                        disabled={poll.status !== PollStatus.ACTIVE}
                      >
                        {Array.from(
                          { length: maxAllowedPoints + 1 },
                          (_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          )
                        )}
                      </select>
                    </Flex>
                  </Flex>
                  {poll.status === PollStatus.COMPLETED && (
                    <Progress.Root
                      value={totalPoints}
                      max={maxPoints * poll.options.length}
                      colorPalette='purple'
                      mt={2}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        );
      }

      case 'RANKED_CHOICE':
        const items = poll.options
          .sort((a, b) => {
            const aVotes = a.votes[0]?.value || Number.MAX_SAFE_INTEGER;
            const bVotes = b.votes[0]?.value || Number.MAX_SAFE_INTEGER;
            return aVotes - bVotes;
          })
          .map((option, index) => ({
            id: option.id,
            title: option.book.title,
            author: option.book.author,
            rank: index + 1,
          }));

        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRankedChoice}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap={4}>
                {items.map((item) => (
                  <SortableItem key={item.id} {...item} />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        );

      case 'BRACKET':
        const currentRound = Math.max(...poll.options.map((o) => o.round || 0));
        const matchups = poll.options.reduce(
          (acc, option) => {
            if (option.round !== currentRound) return acc;
            const matchup = option.matchup || 0;
            if (!acc[matchup]) acc[matchup] = [];
            acc[matchup].push(option);
            return acc;
          },
          {} as Record<number, typeof poll.options>
        );

        return (
          <Stack gap={8}>
            <Heading size='sm'>Round {currentRound}</Heading>
            <Grid
              gap={4}
              templateColumns='repeat(auto-fit, minmax(300px, 1fr))'
            >
              {Object.values(matchups).map((matchup) => (
                <Card.Root key={matchup[0].matchup}>
                  <Card.Header>
                    <Heading size='sm'>Matchup {matchup[0].matchup}</Heading>
                  </Card.Header>
                  <Card.Body>
                    <Stack gap={4}>
                      {matchup.map((option) => {
                        const votes = option.votes.length;
                        const userVoted = option.votes.some(
                          (v) => v.user.clerkId === user?.id
                        );

                        return (
                          <Box
                            key={option.id}
                            bg='whiteAlpha.50'
                            borderRadius='lg'
                            p={4}
                          >
                            <Flex align='center' justify='space-between'>
                              <Box>
                                <Text fontWeight='bold'>
                                  {option.book.title}
                                </Text>
                                <Text color='gray.500' fontSize='sm'>
                                  {option.book.author}
                                </Text>
                              </Box>
                              <Flex align='center' gap={2}>
                                {poll.status === PollStatus.COMPLETED ? (
                                  <Text fontWeight='bold'>{votes} votes</Text>
                                ) : userVoted ? (
                                  <Text color='purple.500' fontSize='sm'>
                                    Voted
                                  </Text>
                                ) : null}
                                <Button
                                  colorPalette={userVoted ? 'purple' : 'gray'}
                                  disabled={
                                    userVoted ||
                                    poll.status !== PollStatus.ACTIVE
                                  }
                                  onClick={() => handleBracketVote(option.id)}
                                  size='sm'
                                >
                                  Vote
                                </Button>
                              </Flex>
                            </Flex>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Grid>
          </Stack>
        );

      default:
        return null;
    }
  };

  const handleRemoveBookFromPoll = async (bookId: string) => {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/polls/${poll.id}/books`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove book from poll');
      }

      queryClient.invalidateQueries({ queryKey: ['polls', groupId] });
      toaster.create({
        title: 'Book removed from poll',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Failed to remove book',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        type: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Card.Root p={4}>
        <Flex align='center' justify='space-between' mb={4}>
          <Box>
            <Heading size='sm'>{poll.title}</Heading>
            {poll.description && (
              <Text color='gray.500' fontSize='sm' mt={1}>
                {poll.description}
              </Text>
            )}
            <Text color='gray.500' fontSize='sm' mt={1}>
              Created {formatDistanceToNow(new Date(poll.createdAt))} ago
            </Text>
            {poll.status === PollStatus.PENDING && (
              <>
                <Text color='yellow.500' fontSize='sm' fontWeight='bold' mt={1}>
                  Voting begins{' '}
                  {formatDistanceToNow(startDate, { addSuffix: true })}
                </Text>
                <Text color='gray.500' fontSize='sm' mt={1}>
                  {format(startDate, 'MMMM d, yyyy h:mm a')} -{' '}
                  {format(endDate, 'MMMM d, yyyy h:mm a')}
                </Text>
              </>
            )}
            {poll.status === PollStatus.ACTIVE && (
              <>
                <Text
                  color={isExpired ? 'red.500' : 'gray.500'}
                  fontSize='sm'
                  mt={1}
                >
                  {isExpired ? 'Ended' : 'Ends'}{' '}
                  {formatDistanceToNow(endDate, { addSuffix: true })}
                </Text>
                <Text color='gray.500' fontSize='sm' mt={1}>
                  {format(startDate, 'MMMM d, yyyy h:mm a')} -{' '}
                  {format(endDate, 'MMMM d, yyyy h:mm a')}
                </Text>
              </>
            )}
          </Box>
          <MenuRoot>
            <MenuTrigger>
              <IconButton aria-label='Poll options' size='sm' variant='ghost'>
                <FaEllipsisV />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              {isAdmin && (
                <MenuItem onClick={() => setIsEditModalOpen(true)} value='edit'>
                  Edit Poll Details
                </MenuItem>
              )}
              {isPending && (
                <MenuItem
                  onClick={() => setIsAddBooksModalOpen(true)}
                  value='add-books'
                >
                  Add Books
                </MenuItem>
              )}
              {poll.status !== PollStatus.CANCELLED && isAdmin && (
                <MenuItem
                  onClick={() => updatePoll({ status: PollStatus.CANCELLED })}
                  value='cancel'
                >
                  Cancel Poll
                </MenuItem>
              )}
              {isAdmin && (
                <MenuItem onClick={() => deletePoll()} value='delete'>
                  Delete Poll
                </MenuItem>
              )}
            </MenuContent>
          </MenuRoot>
        </Flex>

        {poll.status === PollStatus.PENDING && (
          <Box bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Stack gap={4}>
              <Flex align='center' justify='space-between'>
                <Box>
                  <Text>
                    Voting begins{' '}
                    {formatDistanceToNow(startDate, { addSuffix: true })}
                  </Text>
                  <Text color='gray.500' fontSize='sm' mt={1}>
                    Add books to be included in this poll
                  </Text>
                  {poll.votingMethod === 'BRACKET' && (
                    <Text color='purple.500' fontSize='sm' mt={1}>
                      {poll.options.length === 0
                        ? 'Add 2, 4, 8, or 16 books for bracket tournament'
                        : `${poll.options.length} books added. Next valid size: ${getNextValidBracketSize(poll.options.length)} books (${getNextValidBracketSize(poll.options.length) - poll.options.length} more needed)`}
                    </Text>
                  )}
                </Box>
                <Button
                  colorPalette='purple'
                  onClick={() => setIsAddBooksModalOpen(true)}
                  size='sm'
                >
                  + Add Books
                </Button>
              </Flex>
              {poll.options.map((option) => (
                <Box
                  key={option.id}
                  bg='whiteAlpha.100'
                  borderRadius='lg'
                  p={4}
                >
                  <Flex align='center' justify='space-between'>
                    <Box>
                      <Text fontWeight='bold'>{option.book.title}</Text>
                      <Text color='gray.500' fontSize='sm'>
                        {option.book.author}
                      </Text>
                    </Box>
                    {(isAdmin || option.user?.clerkId === user?.id) && (
                      <IconButton
                        aria-label='Remove book'
                        colorPalette='red'
                        onClick={() => handleRemoveBookFromPoll(option.book.id)}
                        size='sm'
                        variant='ghost'
                      >
                        ✕
                      </IconButton>
                    )}
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
        {poll.status === PollStatus.ACTIVE && isPending ? (
          <Box bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Stack gap={4}>
              <Flex align='center' justify='space-between'>
                <Box>
                  <Text>
                    Voting will begin{' '}
                    {formatDistanceToNow(startDate, { addSuffix: true })}
                  </Text>
                  <Text color='gray.500' fontSize='sm' mt={1}>
                    Review and manage book options before voting begins
                  </Text>
                </Box>
                <Button
                  colorPalette='purple'
                  onClick={() => setIsAddBooksModalOpen(true)}
                  size='sm'
                >
                  + Add Books
                </Button>
              </Flex>
              {poll.options.map((option) => (
                <Box
                  key={option.id}
                  bg='whiteAlpha.100'
                  borderRadius='lg'
                  p={4}
                >
                  <Flex align='center' justify='space-between'>
                    <Box>
                      <Text fontWeight='bold'>{option.book.title}</Text>
                      <Text color='gray.500' fontSize='sm'>
                        {option.book.author}
                      </Text>
                    </Box>
                    {(isAdmin || option.user?.clerkId === user?.id) && (
                      <IconButton
                        aria-label='Remove book'
                        colorPalette='red'
                        onClick={() => handleRemoveBookFromPoll(option.book.id)}
                        size='sm'
                        variant='ghost'
                      >
                        ✕
                      </IconButton>
                    )}
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          poll.status === PollStatus.ACTIVE && getVotingInterface()
        )}
        {poll.status === PollStatus.COMPLETED && (
          <Box bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Text>This poll has been completed.</Text>
            <Stack gap={4} mt={4}>
              {poll.votingMethod === 'BRACKET' ? (
                <Stack gap={4}>
                  {[...new Set(poll.options.map((o) => o.round || 0))]
                    .sort((a, b) => b - a)
                    .map((round) => {
                      const roundOptions = poll.options.filter(
                        (o) => o.round === round
                      );
                      return (
                        <Box key={round}>
                          <Text color='purple.500' fontWeight='bold' mb={2}>
                            Round {round}
                          </Text>
                          <Stack gap={2}>
                            {roundOptions.map((option) => {
                              const isWinner =
                                option.round ===
                                Math.max(
                                  ...poll.options.map((o) => o.round || 0)
                                );
                              return (
                                <Box
                                  key={option.id}
                                  bg='whiteAlpha.100'
                                  borderRadius='lg'
                                  p={4}
                                >
                                  <Flex align='center' justify='space-between'>
                                    <Box>
                                      <Text fontWeight='bold'>
                                        {option.book.title}
                                      </Text>
                                      <Text color='gray.500' fontSize='sm'>
                                        {option.book.author}
                                      </Text>
                                      <Text color='gray.500' fontSize='sm'>
                                        {option.votes.length} vote
                                        {option.votes.length === 1 ? '' : 's'}
                                      </Text>
                                    </Box>
                                    {isWinner && (
                                      <Text color='green.500' fontWeight='bold'>
                                        Tournament Winner!
                                      </Text>
                                    )}
                                  </Flex>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      );
                    })}
                </Stack>
              ) : (
                poll.options
                  .sort((a, b) => {
                    const aVotes = a.votes.reduce((sum, v) => sum + v.value, 0);
                    const bVotes = b.votes.reduce((sum, v) => sum + v.value, 0);
                    return bVotes - aVotes;
                  })
                  .map((option, index, sortedOptions) => {
                    const currentVotes = option.votes.reduce(
                      (sum, v) => sum + v.value,
                      0
                    );
                    const highestVotes = sortedOptions[0].votes.reduce(
                      (sum, v) => sum + v.value,
                      0
                    );
                    const isWinner = currentVotes === highestVotes;
                    const hasTie =
                      sortedOptions.filter(
                        (opt) =>
                          opt.votes.reduce((sum, v) => sum + v.value, 0) ===
                          highestVotes
                      ).length > 1;

                    return (
                      <Box
                        key={option.id}
                        bg='whiteAlpha.100'
                        borderRadius='lg'
                        p={4}
                      >
                        <Flex align='center' justify='space-between'>
                          <Box>
                            <Text fontWeight='bold'>{option.book.title}</Text>
                            <Text color='gray.500' fontSize='sm'>
                              {option.book.author}
                            </Text>
                            <Text color='gray.500' fontSize='sm'>
                              {currentVotes} vote{currentVotes === 1 ? '' : 's'}
                            </Text>
                          </Box>
                          {isWinner && (
                            <Text color='green.500' fontWeight='bold'>
                              {hasTie ? 'Tied for 1st!' : 'Winner!'}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    );
                  })
              )}
            </Stack>
          </Box>
        )}
        {poll.status === PollStatus.CANCELLED && (
          <Box bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Text>This poll has been cancelled.</Text>
          </Box>
        )}
      </Card.Root>

      <EditPollModal
        groupId={groupId}
        poll={poll}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <AddBooksModal
        groupId={groupId}
        poll={poll}
        isOpen={isAddBooksModalOpen}
        onClose={() => setIsAddBooksModalOpen(false)}
      />
    </>
  );
}
