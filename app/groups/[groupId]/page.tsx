'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  Stack,
  Button,
  Flex,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { GroupHeader } from '@/components/groups/group-header';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { LuBook, LuBookOpen, LuUsers, LuVote } from 'react-icons/lu';
import { FaCalendarPlus } from 'react-icons/fa';
import { useUpcomingMeeting } from '@/hooks/useMeetings';
import { UpcomingMeeting } from '@/components/meetings/upcoming-meeting';
import { MeetingDialog } from '@/components/meetings/meeting-dialog';

export default function GroupPage() {
  const queryClient = useQueryClient();
  const { groupId } = useParams();
  const { data: group, isLoading, error } = useGroup(groupId as string);
  const { data: upcomingMeeting } = useUpcomingMeeting(groupId as string);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const isAdmin = group?.role === 'ADMIN';

  const handleCreateMeeting = () => {
    setIsMeetingModalOpen(true);
  };

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

  const sections = [
    {
      title: 'Current Book',
      description: 'View and discuss the current book',
      href: `/groups/${groupId}/current-book`,
      icon: LuBookOpen,
    },
    {
      title: 'Previous Books',
      description: 'Browse through all previous books',
      href: `/groups/${groupId}/books`,
      icon: LuBook,
    },
    {
      title: 'Members',
      description: 'View and manage group members',
      href: `/groups/${groupId}/members`,
      icon: LuUsers,
    },
    {
      title: 'Polls',
      description: 'Vote on upcoming books',
      href: `/groups/${groupId}/polls`,
      icon: LuVote,
    },
  ];

  return (
    <Container mx='auto' maxW='6xl' p={4}>
      <GroupHeader group={group} />

      {/* Upcoming meeting section */}
      {upcomingMeeting ? (
        <Box mt={6} mb={6}>
          <Flex justify='space-between' align='center' mb={2}>
            <Heading size='md'>Upcoming Meeting</Heading>
          </Flex>
          <UpcomingMeeting meeting={upcomingMeeting} groupId={group.id} />
        </Box>
      ) : isAdmin ? (
        <Box mt={6} mb={6}>
          <Flex justify='space-between' align='center' mb={2}>
            <Heading size='md'>No Upcoming Meetings</Heading>
            <Button
              size='sm'
              onClick={handleCreateMeeting}
              colorPalette='purple'
            >
              <Box as={FaCalendarPlus} mr={2} />
              Schedule Meeting
            </Button>
          </Flex>
        </Box>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
        {sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Box
              as='article'
              height='full'
              p={6}
              borderWidth='1px'
              borderRadius='lg'
              transition='all 0.2s'
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            >
              <Stack direction='row' gap={4} align='center' mb={4}>
                <Box as={section.icon} fontSize='24px' color='gray.500' />
                <Heading size='md'>{section.title}</Heading>
              </Stack>
              <Text color='gray.600'>{section.description}</Text>
            </Box>
          </Link>
        ))}
      </SimpleGrid>

      {/* Meeting Dialog */}
      <MeetingDialog
        groupId={group.id}
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
      />
    </Container>
  );
}
