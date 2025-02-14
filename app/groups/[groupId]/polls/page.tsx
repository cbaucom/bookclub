'use client';

import { useParams } from 'next/navigation';
import { Container } from '@chakra-ui/react';
import { PollList } from '@/components/polls/poll-list';
import { GroupHeader } from '@/components/groups/group-header';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import { GroupNav } from '@/components/groups/group-nav';

export default function PollsPage() {
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
    <>
      <Container
        mx='auto'
        maxW='6xl'
        px={{ base: 2, md: 4 }}
        py={4}
        pb={{ base: 20, md: 4 }}
      >
        <GroupHeader group={group} />
        <PollList groupId={groupId as string} />
      </Container>
      <GroupNav groupId={groupId as string} />
    </>
  );
}
