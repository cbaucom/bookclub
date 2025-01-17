'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Box, Flex, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { ColorModeButton } from './color-mode';

export function Navbar() {
  return (
    <Box as='nav' w='full' borderBottomWidth='1px' bg='chakra-body-bg'>
      <Flex justify='space-between' align='center' py={4} w='full'>
        <Link as={NextLink} href='/' _hover={{ textDecoration: 'none' }}>
          <Text fontSize='xl' fontWeight='bold'>
            BookClub
          </Text>
        </Link>

        <Flex gap={4} align='center'>
          <SignedIn>
            <Link as={NextLink} href='/dashboard'>
              My Groups
            </Link>
            <Link as={NextLink} href='/discover'>
              Discover
            </Link>
            <ColorModeButton />
            <UserButton afterSignOutUrl='/' />
          </SignedIn>
          <SignedOut>
            <ColorModeButton />
            <SignInButton mode='modal'>
              <Text as='span' cursor='pointer'>
                Sign in
              </Text>
            </SignInButton>
          </SignedOut>
        </Flex>
      </Flex>
    </Box>
  );
}
