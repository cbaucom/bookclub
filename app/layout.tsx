import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from './providers';
import { Navbar } from '@/components/ui/navbar';
import { Box, Container } from '@chakra-ui/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BookClub',
  description: 'A place for book lovers to connect and discuss',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <Providers props={{ defaultTheme: 'system' }}>
            <Box w='full' minH='100vh'>
              <Container maxW='6xl' px={4} mx='auto'>
                <Navbar />
              </Container>
              <Box as='main' w='full'>
                {children}
              </Box>
            </Box>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
