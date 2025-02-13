'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageState } from '@/components/ui/page-state';
import { toaster } from '@/components/ui/toaster';

interface Group {
  id: string;
  name: string;
  description: string | null;
  privacy: 'PUBLIC' | 'PRIVATE';
  _count: {
    members: number;
  };
  isMember: boolean;
}

async function searchGroups(query: string): Promise<Group[]> {
  const response = await fetch(
    `/api/groups/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Failed to search groups');
  return response.json();
}

async function joinGroup(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}/join`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join group');
  }
  return response.json();
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups-search', searchQuery],
    queryFn: () => searchGroups(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const joinMutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups-search'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push(`/groups/${groupId}`);
      toaster.create({
        title: 'Successfully joined group',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toaster.create({
        title: 'Failed to join group',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleJoinById = async () => {
    if (!groupIdInput.trim()) return;
    joinMutation.mutate(groupIdInput.trim());
  };

  return (
    <Container maxW='6xl' mx='auto' px={4} py={8}>
      <Stack gap={8}>
        <Box>
          <Heading as='h1' size='xl' mb={4}>
            Discover Groups
          </Heading>
          <Text fontSize='lg' color='fg.muted'>
            Search for public groups or enter a group ID to join a private group
          </Text>
        </Box>

        <Box>
          <Heading as='h2' size='md' mb={4}>
            Join Private Group
          </Heading>
          <Flex gap={4}>
            <Input
              placeholder='Enter group ID'
              onChange={(e) => setGroupIdInput(e.target.value)}
              size='lg'
              value={groupIdInput}
            />
            <Button
              colorPalette='blue'
              onClick={handleJoinById}
              disabled={!groupIdInput.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Joining...' : 'Join'}
            </Button>
          </Flex>
        </Box>

        <Box>
          <Heading as='h2' size='md' mb={4}>
            Search Public Groups
          </Heading>
          <Input
            placeholder='Search groups...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            mb={4}
            size='lg'
          />

          {isLoading ? (
            <PageState isLoading />
          ) : searchQuery && groups.length === 0 ? (
            <Text color='fg.muted'>No groups found</Text>
          ) : (
            <Stack gap={4}>
              {groups.map((group) => (
                <Box
                  key={group.id}
                  p={4}
                  borderWidth='1px'
                  borderRadius='lg'
                  _hover={{ borderColor: 'purple.500' }}
                >
                  <Flex justify='space-between' align='center'>
                    <Box>
                      <Heading as='h3' size='md'>
                        {group.name}
                      </Heading>
                      {group.description && (
                        <Text color='fg.muted' mt={1}>
                          {group.description}
                        </Text>
                      )}
                      <Flex gap={4} mt={2}>
                        <Text fontSize='sm' color='fg.muted'>
                          {group._count.members} member
                          {group._count.members === 1 ? '' : 's'}
                        </Text>
                        <Text fontSize='sm' color='fg.muted'>
                          {group.privacy.toLowerCase()}
                        </Text>
                      </Flex>
                    </Box>
                    {!group.isMember && (
                      <Button
                        colorPalette='blue'
                        onClick={() => joinMutation.mutate(group.id)}
                        disabled={joinMutation.isPending}
                      >
                        {joinMutation.isPending ? 'Joining...' : 'Join'}
                      </Button>
                    )}
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
