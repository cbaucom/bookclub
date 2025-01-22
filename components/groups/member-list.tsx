import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { PageState } from '@/components/ui/page-state';
import { useState } from 'react';
import { InviteModal } from './invite-modal';
import { Button } from '@/components/ui/button';
import { randomColor } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface MemberListProps {
  groupId: string;
}

export function MemberList({ groupId }: MemberListProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { isAdmin, isLoading, members } = useIsAdmin(groupId);

  if (isLoading) {
    return <PageState isLoading />;
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
        {isAdmin && (
          <Button
            colorPalette='purple'
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Members
          </Button>
        )}
      </Flex>

      <Grid templateColumns='1fr' gap={4}>
        {members.map((member) => (
          <Box key={member.id} p={4} borderWidth='1px' borderRadius='lg'>
            <Flex gap={4} align='center'>
              <Box
                bg={randomColor()}
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
                <Text fontSize='sm' color='fg.muted'>
                  {member.user.email}
                </Text>
              </Box>
              <Box>
                <Text
                  fontSize='sm'
                  color={member.role === 'ADMIN' ? 'red.500' : 'fg.muted'}
                  fontWeight='medium'
                >
                  {member.role}
                </Text>
                <Text fontSize='xs' color='fg.muted'>
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
