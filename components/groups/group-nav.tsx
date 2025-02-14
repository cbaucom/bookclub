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
  const activeBg = useColorModeValue('purple.50', 'purple.900');

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
      display={{ base: 'block', md: 'block' }}
      px={2}
      py={2}
      zIndex={10}
    >
      <Stack
        direction='row'
        gap={2}
        justify={'space-between'}
        overflowX='auto'
        maxW='6xl'
        mx='auto'
        pb={2}
        px={2}
      >
        {sections.map((section) => (
          <Box key={section.title} flex={{ base: 1, md: 'none' }}>
            <Link href={section.href}>
              <Button
                alignItems='center'
                bg={pathname === section.href ? activeBg : 'transparent'}
                color={pathname === section.href ? 'purple.500' : undefined}
                colorPalette='purple'
                display='flex'
                fontWeight={pathname === section.href ? 'bold' : 'normal'}
                gap={2}
                justifyContent='flex-start'
                size='sm'
                variant='ghost'
                width={{ base: 'full', md: 'auto' }}
                _hover={{
                  bg: pathname === section.href ? activeBg : 'purple.50',
                }}
              >
                <Box
                  as={section.icon}
                  color={pathname === section.href ? 'purple.500' : 'inherit'}
                />
                {section.title}
              </Button>
            </Link>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
