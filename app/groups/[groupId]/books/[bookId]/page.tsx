'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { FaAmazon, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useBook } from '@/hooks/useBook';
import { PageState } from '@/components/ui/page-state';
import { EditDatesModal } from '@/components/books/edit-dates-modal';
import { NoteCard } from '@/components/books/note-card';
import { useNotes } from '@/hooks/useNotes';
import type { NoteWithUser } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';

export default function BookPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { groupId, bookId } = useParams();
  const {
    data: book,
    isLoading,
    error,
  } = useBook(bookId as string, groupId as string);
  const { rate, ratings } = useRatings(bookId as string, groupId as string);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isAdmin } = useIsAdmin(groupId as string);
  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const { createMutation } = useNotes(bookId as string, groupId as string);
  const { userId } = useAuth();

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries(); // Invalidate all queries
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (!book) {
    return <PageState notFound notFoundMessage='Book not found' />;
  }

  if (error) {
    return <PageState isError error={error} />;
  }

  const handleRate = (rating: number, review?: string) =>
    rate({ rating, review });

  const handleAddNote = () => {
    if (noteContent.trim()) {
      createMutation.mutate(
        { content: noteContent, bookId: bookId as string },
        {
          onSuccess: () => {
            setNoteContent('');
          },
        }
      );
    }
  };

  return (
    <Container mx='auto' maxW='6xl' px={4} py={8}>
      <Button
        onClick={() => router.back()}
        colorPalette='gray'
        variant='ghost'
        mb={6}
      >
        <FaArrowLeft className='mr-2' /> Back to Group
      </Button>

      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={8}>
        <Box>
          {book.imageUrl && (
            <Box
              position='relative'
              borderRadius='lg'
              overflow='hidden'
              boxShadow='md'
            >
              <Image
                src={book.imageUrl}
                alt={book.title}
                width='100%'
                height='auto'
                objectFit='cover'
              />
            </Box>
          )}

          <VStack mt={4} align='stretch' gap={4}>
            {book.amazonUrl && (
              <Button
                onClick={() =>
                  window.open(book.amazonUrl!, '_blank', 'noopener,noreferrer')
                }
                color='white'
                colorPalette='orange'
                width='100%'
              >
                <FaAmazon /> View on Amazon
              </Button>
            )}
          </VStack>
        </Box>

        <Stack gap={6}>
          <Box>
            <Heading as='h1' size='xl' mb={2}>
              {book.title}
              {book.subtitle && (
                <Text
                  as='span'
                  display='block'
                  fontSize='lg'
                  fontWeight='normal'
                  color={isDark ? 'gray.400' : 'gray.600'}
                  mt={2}
                >
                  {book.subtitle}
                </Text>
              )}
            </Heading>
            <Text fontSize='lg' color={isDark ? 'gray.400' : 'gray.600'} mb={4}>
              {book.author}
            </Text>

            {(book.categories || book.pageCount) && (
              <Flex gap={4} mb={4}>
                {book.categories && (
                  <Box>
                    <Text
                      fontSize='sm'
                      color={isDark ? 'gray.400' : 'gray.600'}
                    >
                      Categories
                    </Text>
                    <Text fontSize='md'>{book.categories}</Text>
                  </Box>
                )}
                {book.pageCount && (
                  <Box>
                    <Text
                      fontSize='sm'
                      color={isDark ? 'gray.400' : 'gray.600'}
                    >
                      Pages
                    </Text>
                    <Text fontSize='md'>{book.pageCount}</Text>
                  </Box>
                )}
              </Flex>
            )}

            <Flex gap={4} mb={6}>
              <Box>
                <Text fontSize='sm' color={isDark ? 'gray.400' : 'gray.600'}>
                  Status
                </Text>
                <Text fontSize='md' fontWeight='medium'>
                  {book.status === 'CURRENT'
                    ? 'Currently Reading'
                    : book.status === 'PREVIOUS'
                      ? 'Previously Read'
                      : 'Upcoming'}
                </Text>
              </Box>

              {book.startDate && (
                <Box>
                  <Text fontSize='sm' color={isDark ? 'gray.400' : 'gray.600'}>
                    Started
                  </Text>
                  <Text fontSize='md' fontWeight='medium'>
                    {new Date(
                      new Date(book.startDate).toDateString()
                    ).toLocaleDateString()}
                  </Text>
                </Box>
              )}

              {book.endDate && (
                <Box>
                  <Text fontSize='sm' color={isDark ? 'gray.400' : 'gray.600'}>
                    Finished
                  </Text>
                  <Text fontSize='md' fontWeight='medium'>
                    {new Date(
                      new Date(book.endDate).toDateString()
                    ).toLocaleDateString()}
                  </Text>
                </Box>
              )}
            </Flex>

            {isAdmin && book.status === 'PREVIOUS' && (
              <Button
                colorPalette='blue'
                variant='ghost'
                onClick={() => setIsEditDatesModalOpen(true)}
                mb={6}
              >
                Edit Dates
              </Button>
            )}

            <Box mb={8}>
              <Heading as='h2' size='md' mb={4}>
                Your Rating & Review
              </Heading>
              <StarRating
                averageRating={book.averageRating}
                onRate={handleRate}
                size='lg'
                totalRatings={book.totalRatings}
                userRating={book.userRating}
              />
            </Box>

            {ratings && ratings.length > 0 && (
              <Box>
                <Heading as='h2' size='md' mb={4}>
                  Group Reviews
                </Heading>
                <Stack gap={4}>
                  {ratings.map((review) => (
                    <Box
                      key={review.id}
                      p={4}
                      borderWidth='1px'
                      borderRadius='lg'
                      bg={isDark ? 'gray.800' : 'white'}
                    >
                      <Flex justify='space-between' align='center' mb={2}>
                        <Text fontWeight='medium'>
                          {review.user.firstName} {review.user.lastName}
                        </Text>
                        <StarRating
                          averageRating={review.rating}
                          size='sm'
                          readOnly
                        />
                      </Flex>
                      {review.review && <Text>{review.review}</Text>}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Notes Section */}
            <Box mt={8}>
              <Heading as='h2' size='md' mb={4}>
                Notes
              </Heading>
              <VStack align='stretch' gap={4}>
                <Box>
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder='Add a note...'
                    p={4}
                    rows={3}
                  />
                  <Button
                    mt={2}
                    colorPalette='purple'
                    onClick={handleAddNote}
                    disabled={createMutation.isPending || !noteContent.trim()}
                    size='xs'
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </Box>

                {book.notes?.map((note: NoteWithUser) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    groupId={groupId as string}
                    bookId={bookId as string}
                    userId={userId as string}
                  />
                ))}
              </VStack>
            </Box>
          </Box>
        </Stack>
      </Grid>

      <EditDatesModal
        bookId={book.id}
        groupId={groupId as string}
        isOpen={isEditDatesModalOpen}
        onClose={() => setIsEditDatesModalOpen(false)}
        initialStartDate={book.startDate}
        initialEndDate={book.endDate}
      />
    </Container>
  );
}
