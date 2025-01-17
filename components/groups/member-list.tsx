import { useQuery } from '@tanstack/react-query';
import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { Membership } from '@prisma/client';
import { BASE_URL } from '@/lib/constants';
import { PageState } from '@/components/ui/page-state';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { InviteModal } from './invite-modal';
import { Button } from '@/components/ui/button';

interface MembershipWithUser extends Membership {
  user: {
    id: string;
    clerkId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

async function fetchMembers(groupId: string): Promise<MembershipWithUser[]> {
  const response = await fetch(`${BASE_URL}/api/groups/${groupId}/members`);
  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }
  return response.json();
}

interface MemberListProps {
  groupId: string;
}

export function MemberList({ groupId }: MemberListProps) {
  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['members', groupId],
    queryFn: () => fetchMembers(groupId),
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { userId } = useAuth();

  const userRole = members?.find(
    (member) => member.user.clerkId === userId
  )?.role;
  const canInvite = userRole === 'ADMIN';

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (error) {
    return <PageState isError error={error as Error} />;
  }

  if (!members?.length) {
    return (
      <Box textAlign='center' py={8}>
        <Text fontSize='lg'>No members found</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify='space-between' align='center' mb={6}>
        <Heading as='h3' size='md'>
          Members ({members.length})
        </Heading>
        {canInvite && (
          <Button
            colorPalette='blue'
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Members
          </Button>
        )}
      </Flex>

      <Grid templateColumns='1fr' gap={4}>
        {members.map((member) => (
          <Box
            key={member.id}
            p={4}
            borderWidth='1px'
            borderRadius='lg'
            _hover={{ bg: 'purple.50' }}
          >
            <Flex gap={4} align='center'>
              <Box
                bg='blue.500'
                borderRadius='full'
                color='white'
                fontSize='lg'
                fontWeight='bold'
                h='48px'
                lineHeight='48px'
                textAlign='center'
                w='48px'
              >
                {member.user.firstName?.[0] || ''}
                {member.user.lastName?.[0] || ''}
              </Box>
              <Box flex='1'>
                <Text fontWeight='bold'>
                  {member.user.firstName} {member.user.lastName}
                </Text>
                <Text fontSize='sm' color='gray.600'>
                  {member.user.email}
                </Text>
              </Box>
              <Box>
                <Text
                  fontSize='sm'
                  color={member.role === 'ADMIN' ? 'blue.500' : 'gray.500'}
                  fontWeight='medium'
                >
                  {member.role}
                </Text>
                <Text fontSize='xs' color='gray.500'>
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            </Flex>
          </Box>
        ))}
      </Grid>
      <InviteModal
        groupId={groupId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </Box>
  );
}
