'use client';

import { useParams } from 'next/navigation';
import { Container, Tabs } from '@chakra-ui/react';
import { BookList } from '@/components/groups/book-list';
import { CurrentBook } from '@/components/groups/current-book';
import { GroupHeader } from '@/components/groups/group-header';
import { MemberList } from '@/components/groups/member-list';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';

export default function GroupPage() {
  const { groupId } = useParams();
  const { data: group, isLoading, error } = useGroup(groupId as string);

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

      <Tabs.Root defaultValue='current'>
        <Tabs.List gap={4}>
          <Tabs.Trigger value='current'>Current Book</Tabs.Trigger>
          <Tabs.Trigger value='previous'>Previous Books</Tabs.Trigger>
          <Tabs.Trigger value='members'>Members</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Indicator />
        <Tabs.Content value='current'>
          <CurrentBook groupId={groupId as string} />
        </Tabs.Content>
        <Tabs.Content value='previous'>
          <BookList groupId={groupId as string} status='PREVIOUS' />
        </Tabs.Content>
        <Tabs.Content value='members'>
          <MemberList groupId={groupId as string} />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
