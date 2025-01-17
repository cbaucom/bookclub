'use client';

import { useGroups } from '@/hooks/useGroups';
import { useGroupMutations } from '@/hooks/useGroupMutations';
import { Box, Container, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Group, Privacy } from '@prisma/client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { createMutation, deleteMutation } = useGroupMutations();
  const { data: groups, isLoading, error } = useGroups();
  const [newGroup, setNewGroup] = useState<Partial<Group>>({
    name: '',
    description: '',
    privacy: 'PUBLIC' as Privacy,
  });

  const handleCreateGroup = (group: Partial<Group>) => {
    createMutation.mutate(group);
  };

  const handleDeleteGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    deleteMutation.mutate(groupId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateGroup(newGroup);
    setNewGroup({
      name: '',
      description: '',
      privacy: 'PUBLIC' as Privacy,
    });
  };

  if (!isLoaded || isLoading) {
    return (
      <Container maxW='6xl' px={4} mx='auto' py={8}>
        <Flex direction='column' gap={4} align='center'>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    );
  }

  if (!isSignedIn) {
    return (
      <Container maxW='6xl' px={4} mx='auto' py={8}>
        <Flex direction='column' gap={4} align='center'>
          <Text>Please sign in to view and manage your groups</Text>
          <SignInButton mode='modal'>
            <Button colorPalette='purple'>Sign In</Button>
          </SignInButton>
        </Flex>
      </Container>
    );
  }

  if (error instanceof Error)
    return <Text color='red.500'>Error: {error.message}</Text>;

  return (
    <Container maxW='6xl' px={4} mx='auto' py={8}>
      <Flex direction='column' gap={8}>
        <Heading>Your Groups</Heading>

        <Flex direction='column' gap={3}>
          {groups?.map((group) => (
            <Box
              key={group.id}
              p={4}
              borderWidth={1}
              borderRadius='md'
              cursor='pointer'
              onClick={() => router.push(`/groups/${group.id}`)}
              _hover={{
                borderColor: 'purple.500',
                bg: 'bg.muted',
              }}
              transition='all 0.2s'
            >
              <Flex justify='space-between' align='center'>
                <Box>
                  <Text fontWeight='bold'>{group.name}</Text>
                  <Text color='fg.muted'>
                    {group.description || 'No description'}
                  </Text>
                  <Text fontSize='sm' color='fg.success' mt={1}>
                    {group.role}
                  </Text>
                </Box>
                {group.role === 'ADMIN' && (
                  <Button
                    colorPalette='red'
                    onClick={(e) => handleDeleteGroup(e, group.id)}
                    size='sm'
                    padding='4'
                  >
                    Delete
                  </Button>
                )}
              </Flex>
            </Box>
          ))}
        </Flex>

        <Heading mt={10}>Create a new group</Heading>
        <form onSubmit={handleSubmit}>
          <Flex direction='column' gap={4}>
            <Box>
              <Text mb={2}>Group Name</Text>
              <Input
                name='name'
                padding='4'
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, name: e.target.value })
                }
                placeholder='Enter group name'
              />
            </Box>

            <Box>
              <Text mb={2}>Description</Text>
              <Input
                name='description'
                padding='4'
                value={newGroup.description || ''}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, description: e.target.value })
                }
                placeholder='Enter group description'
              />
            </Box>

            <Box>
              <Text mb={2}>Privacy</Text>
              <select
                name='privacy'
                value={newGroup.privacy || 'PUBLIC'}
                onChange={(e) =>
                  setNewGroup({
                    ...newGroup,
                    privacy: e.target.value as Privacy,
                  })
                }
                style={{
                  padding: '0.5rem',
                  width: '100%',
                  borderWidth: '1px',
                  borderRadius: '0.375rem',
                }}
              >
                <option value='PUBLIC'>Public</option>
                <option value='PRIVATE'>Private</option>
              </select>
            </Box>

            <Button type='submit' colorPalette='purple'>
              Create Group
            </Button>
          </Flex>
        </form>
      </Flex>
    </Container>
  );
}
