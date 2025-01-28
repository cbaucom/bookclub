'use client';

import { Box, Container } from '@chakra-ui/react';
import { UserProfile } from '@clerk/nextjs';
import React from 'react';

export default function UserProfilePage() {
  return (
    <Container maxW='container.xl' marginX='auto' width='100%' p={0}>
      <Box p={4} display='flex' justifyContent='center'>
        <UserProfile
          path='/user-profile'
          routing='path'
          appearance={{
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
