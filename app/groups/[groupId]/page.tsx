'use client';

import { useParams } from 'next/navigation';
import { Container, Tabs, Box } from '@chakra-ui/react';
import { BookList } from '@/components/groups/book-list';
import { CurrentBook } from '@/components/groups/current-book';
import { GroupHeader } from '@/components/groups/group-header';
import { MemberList } from '@/components/groups/member-list';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function GroupPage() {
  const queryClient = useQueryClient();
  const { groupId } = useParams();
  const { data: group, isLoading, error } = useGroup(groupId as string);

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries(); // Invalidate all queries
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (!group) {
    return <PageState notFound notFoundMessage='Group not found' />;
  }

  if (error) {
    return <PageState isError error={error} />;
  }

  return (
    <Container mx='auto' maxW='6xl' px={4} py={8}>
      <GroupHeader group={group} />

      <Box mt={2}>
        <Tabs.Root defaultValue='current'>
          <Tabs.List gap={2} overflowX='auto' pb={2} mb={-2}>
            <Tabs.Trigger
              value='current'
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Current Book
            </Tabs.Trigger>
            <Tabs.Trigger
              value='previous'
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Previous Books
            </Tabs.Trigger>
            <Tabs.Trigger
              value='members'
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Members
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Indicator />
          <Tabs.Content value='current' pt={6}>
            <CurrentBook groupId={groupId as string} />
          </Tabs.Content>
          <Tabs.Content value='previous' pt={6}>
            <BookList groupId={groupId as string} status='PREVIOUS' />
          </Tabs.Content>
          <Tabs.Content value='members' pt={6}>
            <MemberList groupId={groupId as string} />
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Container>
  );
}
