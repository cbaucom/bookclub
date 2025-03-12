'use client';

import { useParams } from 'next/navigation';
import { Container } from '@chakra-ui/react';
import { MemberList } from '@/components/groups/member-list';
import { GroupHeader } from '@/components/groups/group-header';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import { GroupNav } from '@/components/groups/group-nav';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function MembersPage() {
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
    <>
      <Container mx='auto' maxW='6xl' mb={24} px={4} py={4}>
        <GroupHeader group={group} />
        <MemberList groupId={groupId as string} />
      </Container>
      <GroupNav groupId={groupId as string} />
    </>
  );
}
