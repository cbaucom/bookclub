'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { FontModeProvider } from '@/components/ui/font-mode';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { ColorModeProviderProps } from '@/components/ui/color-mode';

const queryClient = new QueryClient();

export default function Providers({
  children,
  props,
}: {
  children: React.ReactNode;
  props: ColorModeProviderProps;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class'>
        <ChakraProvider value={defaultSystem}>
          <ColorModeProvider {...props} />
          <FontModeProvider>
            {children}
            <Toaster />
          </FontModeProvider>
        </ChakraProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
