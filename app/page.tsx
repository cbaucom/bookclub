'use client';

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Box, Button, Container, Flex, Heading, Text } from '@chakra-ui/react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxW='6xl' px={4} mx='auto'>
      <Flex
        align='center'
        direction='column'
        gap={8}
        py={20}
        textAlign='center'
      >
        <Heading as='h1' size='2xl'>
          Welcome to BookClub
        </Heading>
        <Text fontSize='xl' maxW='2xl'>
          Join a community of book lovers. Create or join book clubs, discuss
          your favorite reads, and discover new books with like-minded people.
        </Text>
        <SignedOut>
          <Box>
            <SignInButton mode='modal'>
              <Button px={8} size='lg' colorPalette='black'>
                Get Started
              </Button>
            </SignInButton>
          </Box>
        </SignedOut>
        <SignedIn>
          <Link href='/dashboard' passHref>
            <Button px={8} size='lg' colorPalette='black'>
              View My Groups
            </Button>
          </Link>
        </SignedIn>
      </Flex>
    </Container>
  );
}
