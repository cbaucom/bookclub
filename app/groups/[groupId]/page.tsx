'use client';

import { useParams } from 'next/navigation';
import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  Stack,
} from '@chakra-ui/react';
import { GroupHeader } from '@/components/groups/group-header';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { LuBook, LuBookOpen, LuUsers, LuVote } from 'react-icons/lu';

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
    </Container>
  );
}
