'use client';

import { useParams } from 'next/navigation';
import { Container, Box, useBreakpointValue } from '@chakra-ui/react';
import { BookList } from '@/components/groups/book-list';
import { CurrentBook } from '@/components/groups/current-book';
import { GroupHeader } from '@/components/groups/group-header';
import { MemberList } from '@/components/groups/member-list';
import { useGroup } from '@/hooks/useGroup';
import { PageState } from '@/components/ui/page-state';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PollList } from '@/components/polls/poll-list';
import { Tabs } from '@chakra-ui/react';
import {
  AccordionRoot,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
} from '@/components/ui/accordion';

export default function GroupPage() {
  const queryClient = useQueryClient();
  const { groupId } = useParams();
  const { data: group, isLoading, error } = useGroup(groupId as string);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem(`accordion-${groupId}`);
    if (saved) {
      setOpenSections(JSON.parse(saved));
    }
  }, [groupId]);

  const handleValueChange = (details: { value: string[] }) => {
    setOpenSections(details.value);
    localStorage.setItem(`accordion-${groupId}`, JSON.stringify(details.value));
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
      value: 'current',
      content: <CurrentBook groupId={groupId as string} />,
    },
    {
      title: 'Previous Books',
      value: 'previous',
      content: <BookList groupId={groupId as string} status='PREVIOUS' />,
    },
    {
      title: 'Members',
      value: 'members',
      content: <MemberList groupId={groupId as string} />,
    },
    {
      title: 'Polls',
      value: 'polls',
      content: <PollList groupId={groupId as string} />,
    },
  ];

  return (
    <Container mx='auto' maxW='6xl' p={4}>
      <GroupHeader group={group} />

      <Box mt={2}>
        {isMobile ? (
          <AccordionRoot
            collapsible
            value={openSections}
            onValueChange={handleValueChange}
          >
            {sections.map((section) => (
              <AccordionItem key={section.value} value={section.value}>
                <AccordionItemTrigger>{section.title}</AccordionItemTrigger>
                <AccordionItemContent>
                  <Box
                    maxH='70vh'
                    overflowY='auto'
                    css={{
                      scrollBehavior: 'smooth',
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'var(--chakra-colors-gray-300)',
                        borderRadius: '24px',
                      },
                    }}
                  >
                    {section.content}
                  </Box>
                </AccordionItemContent>
              </AccordionItem>
            ))}
          </AccordionRoot>
        ) : (
          <Tabs.Root defaultValue='current'>
            <Tabs.List gap={2} overflowX='auto' pb={2} mb={-2}>
              {sections.map((section) => (
                <Tabs.Trigger
                  key={section.value}
                  value={section.value}
                  px={4}
                  py={2}
                  fontSize='md'
                >
                  {section.title}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Indicator />
            {sections.map((section) => (
              <Tabs.Content key={section.value} value={section.value} pt={6}>
                {section.content}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        )}
      </Box>
    </Container>
  );
}
