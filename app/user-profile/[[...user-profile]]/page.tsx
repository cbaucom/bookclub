'use client';

import { useColorMode } from '@/components/ui/color-mode';
import { Box, Container } from '@chakra-ui/react';
import { UserProfile } from '@clerk/nextjs';
import React from 'react';
import { dark } from '@clerk/themes';

export default function UserProfilePage() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Container maxW='container.xl' marginX='auto' width='100%' p={0}>
      <Box p={4} display='flex' justifyContent='center'>
        <UserProfile
          path='/user-profile'
          routing='path'
          appearance={{
            baseTheme: isDark ? dark : undefined,
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '800px',
              },
            },
          }}
        />
      </Box>
    </Container>
  );
}
