import { useQuery } from '@tanstack/react-query';
import { Box, Button, Flex, Heading, Stack } from '@chakra-ui/react';
import { PollWithOptions } from '@/types';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { CreatePollModal } from './create-poll-modal';
import { PollCard } from './poll-card';
import { useState } from 'react';
import { PageState } from '../ui/page-state';
import { PollStatus } from '@prisma/client';
import { EmptyState } from '../ui/empty-state';
import { FaVoteYea } from 'react-icons/fa';

interface PollListProps {
  groupId: string;
}

export function PollList({ groupId }: PollListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isAdmin } = useIsAdmin(groupId);

  const { data: polls, isLoading } = useQuery<PollWithOptions[]>({
    queryKey: ['polls', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/polls`);
      if (!response.ok) throw new Error('Failed to fetch polls');
      return response.json();
    },
  });

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (!polls?.length) {
    return (
      <EmptyState
        icon={<FaVoteYea size={24} />}
        title='No Polls'
        description='Create a poll to get started selecting a book for your reading group.'
      >
        <Button
          colorPalette='purple'
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Create Poll
        </Button>
        <CreatePollModal
          groupId={groupId}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </EmptyState>
    );
  }

  const activePolls = polls.filter((poll) => poll.status === PollStatus.ACTIVE);
  const completedPolls = polls.filter(
    (poll) => poll.status === PollStatus.COMPLETED
  );
  const cancelledPolls = polls.filter(
    (poll) => poll.status === PollStatus.CANCELLED
  );
  const pendingPolls = polls.filter(
    (poll) => poll.status === PollStatus.PENDING
  );

  return (
    <Box>
      <Flex align='center' justify='space-between' mb={6}>
        <Heading size='md'></Heading>
        {isAdmin && (
          <Button
            colorPalette='purple'
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Poll
          </Button>
        )}
      </Flex>

      <Stack gap={8}>
        {pendingPolls.length > 0 && (
          <Box>
            <Heading mb={4} size='sm'>
              Pending Polls
            </Heading>
            <Stack gap={4}>
              {pendingPolls.map((poll) => (
                <PollCard key={poll.id} groupId={groupId} poll={poll} />
              ))}
            </Stack>
          </Box>
        )}

        {activePolls.length > 0 && (
          <Box>
            <Heading mb={4} size='sm'>
              Active Polls
            </Heading>
            <Stack gap={4}>
              {activePolls.map((poll) => (
                <PollCard key={poll.id} groupId={groupId} poll={poll} />
              ))}
            </Stack>
          </Box>
        )}

        {completedPolls.length > 0 && (
          <Box>
            <Heading mb={4} size='sm'>
              Completed Polls
            </Heading>
            <Stack gap={4}>
              {completedPolls.map((poll) => (
                <PollCard key={poll.id} groupId={groupId} poll={poll} />
              ))}
            </Stack>
          </Box>
        )}

        {cancelledPolls.length > 0 && (
          <Box>
            <Heading mb={4} size='sm'>
              Cancelled Polls
            </Heading>
            <Stack gap={4}>
              {cancelledPolls.map((poll) => (
                <PollCard key={poll.id} groupId={groupId} poll={poll} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <CreatePollModal
        groupId={groupId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Box>
  );
}
