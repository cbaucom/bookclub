'use client';

import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { Box, Flex, Link, Text, IconButton } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import NextLink from 'next/link';
import { ColorModeButton, useColorMode } from './color-mode';
import { useFontMode } from './font-mode';
import {
  FaBars,
  FaMoon,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUser,
  FaFont,
} from 'react-icons/fa';
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
} from './drawer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { FaUserGroup } from 'react-icons/fa6';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();
  const { fontMode, toggleFontMode } = useFontMode();

  const handleSignOut = () => {
    onClose();
    signOut(() => router.push('/'));
  };

  const NavLinks = () => (
    <>
      <Link as={NextLink} href='/groups'>
        My Groups
      </Link>
      <Link as={NextLink} href='/discover'>
        Discover
      </Link>
      <ColorModeButton />
    </>
  );

  const DrawerNavLinks = () => (
    <Flex direction='column' gap={4}>
      <Link as={NextLink} href='/groups' onClick={onClose}>
        <Flex align='center' gap={2}>
          <FaUserGroup />
          My Groups
        </Flex>
      </Link>
      <Link as={NextLink} href='/discover' onClick={onClose}>
        <Flex align='center' gap={2}>
          <FaSearch />
          Discover
        </Flex>
      </Link>
      <Link
        as='button'
        onClick={() => {
          toggleColorMode();
          onClose();
        }}
      >
        <Flex align='center' gap={2}>
          {colorMode === 'light' ? <FaMoon /> : <FaSun />}
          Change to {colorMode === 'light' ? 'Dark' : 'Light'} Mode
        </Flex>
      </Link>
      <Link
        as='button'
        onClick={() => {
          toggleFontMode();
          onClose();
        }}
      >
        <Flex align='center' gap={2}>
          <FaFont />
          Change to {fontMode === 'sans' ? 'Mono' : 'Sans'} Font
        </Flex>
      </Link>
    </Flex>
  );

  const ProfileLinks = () => (
    <>
      <Flex align='center' gap={3}>
        <Box position='relative'>
          <Avatar
            size='sm'
            src={user?.imageUrl || ''}
            name={user?.fullName || ''}
          />
        </Box>
        <Box>
          <Text fontWeight='medium'>{user?.fullName}</Text>
          <Text fontSize='sm' color='gray.500'>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </Box>
      </Flex>
      <Link
        alignItems='center'
        as={NextLink}
        display='flex'
        gap={2}
        href='/user-profile'
        onClick={onClose}
      >
        <FaUser />
        Account Settings
      </Link>

      <DrawerNavLinks />

      <Link
        alignItems='center'
        as='button'
        display='flex'
        gap={2}
        onClick={handleSignOut}
        textAlign='left'
        width='100%'
      >
        <FaSignOutAlt />
        Sign Out
      </Link>
    </>
  );

  return (
    <Box as='nav' w='full' borderBottomWidth='1px' bg='chakra-body-bg'>
      <Flex justify='space-between' align='center' py={4} w='full'>
        <Link as={NextLink} href='/' _hover={{ textDecoration: 'none' }}>
          <Text fontSize='xl' fontWeight='bold'>
            BookClub
          </Text>
        </Link>

        <SignedIn>
          {/* Desktop Navigation */}
          <Flex gap={4} align='center' display={{ base: 'none', md: 'flex' }}>
            <NavLinks />
            <Box position='relative' cursor='pointer' onClick={onOpen}>
              <Avatar
                size='sm'
                src={user?.imageUrl || ''}
                name={user?.fullName || ''}
              />
            </Box>
          </Flex>

          {/* Mobile Navigation */}
          <Flex gap={4} align='center' display={{ base: 'flex', md: 'none' }}>
            <IconButton aria-label='Open menu' variant='ghost' onClick={onOpen}>
              <FaBars />
            </IconButton>
          </Flex>

          <DrawerRoot open={isOpen} onOpenChange={onClose}>
            <DrawerContent>
              <DrawerHeader>
                <Text fontSize='xl' fontWeight='bold'>
                  Menu
                </Text>
                <DrawerCloseTrigger />
              </DrawerHeader>
              <DrawerBody>
                <Box borderTopWidth={1} pt={4}>
                  <Flex direction='column' gap={4}>
                    <ProfileLinks />
                  </Flex>
                </Box>
              </DrawerBody>
            </DrawerContent>
          </DrawerRoot>
        </SignedIn>

        <SignedOut>
          <Flex gap={4} align='center'>
            <ColorModeButton />
            <SignInButton mode='modal'>
              <Text as='span' cursor='pointer'>
                Sign in
              </Text>
            </SignInButton>
          </Flex>
        </SignedOut>
      </Flex>
    </Box>
  );
}
