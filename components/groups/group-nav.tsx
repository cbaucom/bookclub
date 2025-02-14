import { Box, Button, Stack } from '@chakra-ui/react';
import {
  LuBook,
  LuBookOpen,
  LuLayoutDashboard,
  LuUsers,
  LuVote,
} from 'react-icons/lu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useColorModeValue } from '@/components/ui/color-mode';

interface GroupNavProps {
  groupId: string;
}

export function GroupNav({ groupId }: GroupNavProps) {
  const pathname = usePathname();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const sections = [
    {
      title: 'Overview',
      href: `/groups/${groupId}`,
      icon: LuLayoutDashboard,
    },
    {
      title: 'Current Book',
      href: `/groups/${groupId}/current-book`,
      icon: LuBookOpen,
    },
    {
      title: 'Previous Books',
      href: `/groups/${groupId}/books`,
      icon: LuBook,
    },
    {
      title: 'Members',
      href: `/groups/${groupId}/members`,
      icon: LuUsers,
    },
    {
      title: 'Polls',
      href: `/groups/${groupId}/polls`,
      icon: LuVote,
    },
  ];

  // Don't show on the overview page
  if (pathname === `/groups/${groupId}`) {
    return null;
  }

  return (
    <Box
      position='fixed'
      bottom={0}
      left={0}
      right={0}
      borderTopWidth={1}
      borderColor={borderColor}
      bg={bg}
      display={{ base: 'block', md: 'none' }}
      px={2}
      py={2}
      zIndex={10}
    >
      <Stack direction='row' gap={2} overflowX='auto' pb={2}>
        {sections.map((section) => (
          <Link key={section.title} href={section.href} style={{ flex: 1 }}>
            <Button
              variant='ghost'
              size='sm'
              width='full'
              colorScheme={pathname === section.href ? 'purple' : 'gray'}
              display='flex'
              alignItems='center'
              justifyContent='flex-start'
              gap={2}
            >
              <Box as={section.icon} />
              {section.title}
            </Button>
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
