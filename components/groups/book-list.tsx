import {
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddBookModal } from './add-book-modal';
import { StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { FaTrash, FaAmazon, FaBookOpen } from 'react-icons/fa';
import { LuBookMarked, LuBookPlus, LuBookOpen } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useBooks } from '@/hooks/useBooks';
import { BookWithRatings } from '@/types';
import { ReviewItem } from '@/components/books/star-rating';
import { DeleteBookDialog } from './delete-book-dialog';
import { EditDatesModal } from '@/components/books/edit-dates-modal';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

function BookCard({
  book,
  groupId,
}: {
  book: BookWithRatings;
  groupId: string;
}) {
  const { rate, ratings, calculateRatingStats } = useRatings(book.id, groupId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isAdmin } = useIsAdmin(groupId);
  const { userId } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

  const { userRating, averageRating, totalRatings } = calculateRatingStats(
    ratings,
    userId || null
  );
  const currentRating = userRating ?? book.userRating;
  const currentAverageRating = averageRating ?? book.averageRating;
  const currentTotalRatings = totalRatings || book.totalRatings || 0;

  const handleRate = (rating: number, review?: string) =>
    rate({ rating, review });

  return (
    <>
      <Box
        borderWidth='1px'
        borderRadius='lg'
        bg={isDark ? 'gray.800' : 'white'}
        boxShadow='sm'
        _hover={{ boxShadow: 'md' }}
        transition='all 0.2s'
        height='100%'
        display='flex'
        flexDirection='column'
      >
        <Link
          href={`/groups/${groupId}/books/${book.id}`}
          style={{ display: 'block', flex: 1 }}
        >
          <Box flex='1' minH={0}>
            <Grid
              templateColumns={{ base: '80px 1fr', md: '120px 1fr' }}
              gap={4}
            >
              {book.imageUrl && (
                <Box position='relative'>
                  <Box
                    position='relative'
                    paddingBottom='150%' // 2:3 aspect ratio
                    width='100%'
                  >
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      position='absolute'
                      top={0}
                      left={0}
                      width='100%'
                      height='100%'
                      objectFit='cover'
                      borderRightWidth='1px'
                      borderColor={isDark ? 'gray.700' : 'gray.100'}
                    />
                  </Box>
                </Box>
              )}
              <Box p={4} pt={3} display='flex' flexDirection='column' minH={0}>
                <Flex direction='column' gap={3} flex='1'>
                  <Flex justify='space-between' align='flex-start' gap={2}>
                    <VStack align='flex-start' gap={1} flex={1}>
                      <Heading
                        as='h3'
                        size='md'
                        maxW='100%'
                        overflow='hidden'
                        textOverflow='ellipsis'
                        css={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {book.title}
                      </Heading>
                      <Text
                        color={isDark ? 'gray.400' : 'gray.600'}
                        fontSize='sm'
                        maxW='100%'
                        overflow='hidden'
                        textOverflow='ellipsis'
                        whiteSpace='nowrap'
                      >
                        {book.author}
                      </Text>
                    </VStack>
                    {isAdmin && (
                      <Button
                        size='sm'
                        colorPalette='red'
                        variant='ghost'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDeleteDialogOpen(true);
                        }}
                        flexShrink={0}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </Flex>

                  <Box>
                    <StarRating
                      averageRating={currentAverageRating}
                      onRate={handleRate}
                      size='sm'
                      totalRatings={currentTotalRatings}
                      userRating={currentRating}
                    />
                  </Box>

                  <Stack gap={1} mt='auto'>
                    {book.startDate && (
                      <Text
                        fontSize='xs'
                        color={isDark ? 'gray.400' : 'gray.600'}
                      >
                        Started:{' '}
                        {new Date(
                          new Date(book.startDate).toDateString()
                        ).toLocaleDateString()}
                      </Text>
                    )}
                    {book.endDate && (
                      <Text
                        fontSize='xs'
                        color={isDark ? 'gray.400' : 'gray.600'}
                      >
                        Finished:{' '}
                        {new Date(
                          new Date(book.endDate).toDateString()
                        ).toLocaleDateString()}
                      </Text>
                    )}
                    {isAdmin && book.status === 'PREVIOUS' && (
                      <Button
                        size='xs'
                        colorPalette='blue'
                        variant='ghost'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditDatesModalOpen(true);
                        }}
                      >
                        Edit Dates
                      </Button>
                    )}
                  </Stack>

                  {book.amazonUrl && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          book.amazonUrl!,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                      size='sm'
                      color='white'
                      colorPalette='orange'
                      width='fit-content'
                      mt={2}
                    >
                      <FaAmazon /> View on Amazon
                    </Button>
                  )}
                </Flex>
              </Box>
            </Grid>
          </Box>
        </Link>

        {ratings && ratings.length > 0 && (
          <Box
            borderTopWidth='1px'
            borderColor={isDark ? 'gray.700' : 'gray.100'}
            p={4}
            bg={isDark ? 'gray.900' : 'gray.50'}
          >
            <Heading as='h4' size='sm' mb={2}>
              Reviews
            </Heading>
            <Stack gap={3}>
              {ratings.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      <EditDatesModal
        bookId={book.id}
        groupId={groupId}
        isOpen={isEditDatesModalOpen}
        onClose={() => setIsEditDatesModalOpen(!isEditDatesModalOpen)}
        initialStartDate={book.startDate}
        initialEndDate={book.endDate}
      />

      <DeleteBookDialog
        bookId={book.id}
        groupId={groupId}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title={book.title}
      />
    </>
  );
}

interface BookListProps {
  groupId: string;
  status: 'CURRENT' | 'PREVIOUS' | 'UPCOMING';
}

export function BookList({ groupId, status }: BookListProps) {
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const { data: books, isLoading } = useBooks(groupId, status);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!books?.length) {
    const emptyStateProps = {
      PREVIOUS: {
        icon: <LuBookMarked size={24} />,
        title: 'No Books Read Yet',
        description: 'Add books that your group has finished reading.',
        buttonText: "Add a Book You've Read",
      },
      UPCOMING: {
        icon: <LuBookPlus size={24} />,
        title: 'No Upcoming Books',
        description: 'Add books that your group plans to read next.',
        buttonText: 'Add a Book to Read',
      },
      CURRENT: {
        icon: <LuBookOpen size={24} />,
        title: 'No Current Books',
        description: 'Add a book that your group is currently reading.',
        buttonText: 'Add a Book',
      },
    }[status];

    return (
      <>
        <EmptyState
          icon={emptyStateProps.icon}
          title={emptyStateProps.title}
          description={emptyStateProps.description}
        >
          <Button
            mt={4}
            colorPalette='purple'
            size='sm'
            onClick={() => setIsAddBookModalOpen(true)}
          >
            {emptyStateProps.icon}
            {emptyStateProps.buttonText}
          </Button>
        </EmptyState>
        <AddBookModal
          groupId={groupId}
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(!isAddBookModalOpen)}
          defaultStatus={status}
        />
      </>
    );
  }

  return (
    <Box mt={8}>
      <Flex justify='space-between' align='center' mb={6}>
        <Heading as='h3' size='md'>
          {status === 'PREVIOUS'
            ? "Books You've Read"
            : status === 'UPCOMING'
              ? 'Books to Read Next'
              : 'Books'}
        </Heading>
        <Button
          colorPalette='purple'
          onClick={() => setIsAddBookModalOpen(true)}
        >
          <FaBookOpen />
          Add Book
        </Button>
      </Flex>

      <Grid templateColumns={'1fr'} gap={6}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} groupId={groupId} />
        ))}
      </Grid>
      <AddBookModal
        groupId={groupId}
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(!isAddBookModalOpen)}
        defaultStatus={status}
      />
    </Box>
  );
}
