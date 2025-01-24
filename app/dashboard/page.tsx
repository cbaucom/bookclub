'use client';

import { useGroups } from '@/hooks/useGroups';
import { useGroupMutations } from '@/hooks/useGroupMutations';
import { Box, Container, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Privacy } from '@prisma/client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { FaBook, FaLock, FaUsers } from 'react-icons/fa';
import { useTheme } from 'next-themes';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { createMutation } = useGroupMutations();
  const { data: groups, isLoading, error } = useGroups();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCreateGroup = (group: {
    name: string;
    description: string;
    privacy: Privacy;
  }) => {
    createMutation.mutate(group, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
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
        <Flex justify='space-between' align='center'>
          <Heading>Your Groups</Heading>
          <Button
            colorPalette='purple'
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Group
          </Button>
        </Flex>

        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {groups?.map((group) => (
            <Box
              key={group.id}
              p={6}
              borderWidth={1}
              borderRadius='xl'
              cursor='pointer'
              onClick={() => router.push(`/groups/${group.id}`)}
              _hover={{
                borderColor: 'purple.500',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition='all 0.2s'
              bg={isDark ? 'gray.800' : 'white'}
              position='relative'
              overflow='hidden'
            >
              {group.privacy === 'PRIVATE' && (
                <Box
                  position='absolute'
                  top={4}
                  right={4}
                  color={isDark ? 'gray.400' : 'gray.500'}
                >
                  <FaLock />
                </Box>
              )}
              <Flex direction='column' gap={4} h='full'>
                <Box>
                  <Heading size='md' mb={2}>
                    {group.name}
                  </Heading>
                  <Text color='fg.muted' maxH='3.2em' overflow='hidden'>
                    {group.description || 'No description'}
                  </Text>
                </Box>

                <Flex direction='column' gap={2} mt='auto'>
                  <Flex align='center' gap={2}>
                    <Box color={isDark ? 'gray.400' : 'gray.500'}>
                      <FaUsers />
                    </Box>
                    <Text fontSize='sm' color='fg.muted'>
                      {group._count?.members || 0} members
                    </Text>
                  </Flex>
                  <Flex align='center' gap={2} minH='24px'>
                    {group.currentBook ? (
                      <>
                        <Box color={isDark ? 'gray.400' : 'gray.500'}>
                          <FaBook />
                        </Box>
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          maxW='200px'
                          overflow='hidden'
                          textOverflow='ellipsis'
                          whiteSpace='nowrap'
                        >
                          Reading: {group.currentBook.title}
                        </Text>
                      </>
                    ) : null}
                  </Flex>

                  <Text
                    fontSize='sm'
                    color={group.role === 'ADMIN' ? 'purple.500' : 'fg.muted'}
                    fontWeight={group.role === 'ADMIN' ? 'medium' : 'normal'}
                  >
                    {group.role}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          ))}
        </Grid>

        <CreateGroupDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
          isLoading={createMutation.isPending}
        />
      </Flex>
    </Container>
  );
}
