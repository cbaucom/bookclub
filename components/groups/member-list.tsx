import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { PageState } from '@/components/ui/page-state';
import { useState } from 'react';
import { InviteModal } from './invite-modal';
import { Button } from '@/components/ui/button';
import { randomColor } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Avatar } from '../ui/avatar';

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
            + Invite Members
          </Button>
        )}
      </Flex>

      <Grid gap={4} maxW='100%' width='100%'>
        {members.map((member) => (
          <Box
            key={member.id}
            bg='whiteAlpha.50'
            borderRadius='lg'
            borderWidth='1px'
            maxW='100%'
            p={4}
            transition='all 0.2s'
            width='100%'
            _hover={{ borderColor: 'purple.500' }}
          >
            <Flex
              align='center'
              gap={4}
              justify='space-between'
              maxW='100%'
              width='100%'
              wrap={{ base: 'wrap', md: 'nowrap' }}
            >
              <Flex align='center' flex={1} gap={4} minWidth={0}>
                <Avatar
                  colorPalette={randomColor()}
                  size={{ base: 'sm', md: 'md' }}
                  src={member.user.imageUrl || undefined}
                  variant='subtle'
                />
                <Box flex={1} minWidth={0}>
                  <Text
                    fontWeight='bold'
                    maxW='100%'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    whiteSpace='nowrap'
                  >
                    {member.user.firstName} {member.user.lastName}
                  </Text>
                  <Text
                    color='fg.muted'
                    fontSize='sm'
                    maxW='100%'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    whiteSpace='nowrap'
                  >
                    {member.user.email}
                  </Text>
                </Box>
              </Flex>

              <Flex
                align={{ base: 'start', md: 'end' }}
                direction='column'
                flexShrink={0}
                gap={1}
                ml={{ base: 0, md: 4 }}
                mt={{ base: 2, md: 0 }}
                width={{ base: '100%', md: 'auto' }}
              >
                <Text
                  color={member.role === 'ADMIN' ? 'red.500' : 'fg.muted'}
                  fontSize='sm'
                  fontWeight='medium'
                  textAlign={{ base: 'left', md: 'right' }}
                >
                  {member.role}
                </Text>
                <Text
                  color='fg.muted'
                  fontSize='xs'
                  textAlign={{ base: 'left', md: 'right' }}
                >
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </Text>
              </Flex>
            </Flex>
          </Box>
        ))}
      </Grid>

      <InviteModal
        groupId={groupId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(!isInviteModalOpen)}
      />
    </Box>
  );
}
