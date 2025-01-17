import { Box, Heading, Text } from '@chakra-ui/react';
import type { GroupWithRole } from '@/types';

interface GroupHeaderProps {
  group: GroupWithRole;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <Box pb={4}>
      <Heading as='h1' size='2xl'>
        {group.name}
      </Heading>
      {group.description && (
        <Text mt={4} fontSize='md' color='fg.muted'>
          {group.description}
        </Text>
      )}
    </Box>
  );
}
