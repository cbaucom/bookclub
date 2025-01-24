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
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useCurrentBook } from '@/hooks/useBooks';
import { useNotes } from '@/hooks/useNotes';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { useState } from 'react';
import { AddBookModal } from './add-book-modal';
import { PageState } from '@/components/ui/page-state';
import { ReviewItem, StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { useBookMutations } from '@/hooks/useBookMutations';
import {
  FaCheck,
  FaAmazon,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import { BookDescriptionModal } from '@/components/books/book-description-modal';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { DeleteBookDialog } from './delete-book-dialog';
import { useAuth } from '@clerk/nextjs';

interface CurrentBookProps {
  groupId: string;
}

export function CurrentBook({ groupId }: CurrentBookProps) {
  const { data: book, isLoading } = useCurrentBook(groupId);
  const { rate, ratings } = useRatings(book?.id || '', groupId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { finishMutation } = useBookMutations(book?.id || '', groupId);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isAdmin } = useIsAdmin(groupId);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const { createMutation } = useNotes(book?.id || '', groupId);
  const { updateMutation, deleteMutation } = useNoteMutations(
    book?.id || '',
    groupId
  );
  const { userId } = useAuth();

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (!book) {
    return (
      <Box textAlign='center' py={8}>
        <Text fontSize='lg'>No current book</Text>
        <Button
          mt={4}
          colorPalette='purple'
          size='sm'
          onClick={() => setIsAddBookModalOpen(true)}
        >
          Add a Book
        </Button>
        <AddBookModal
          groupId={groupId}
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(false)}
        />
      </Box>
    );
  }

  const handleRate = (rating: number, review?: string) =>
    rate({ rating, review });

  const handleFinish = () => {
    if (
      window.confirm('Are you sure you want to mark this book as finished?')
    ) {
      finishMutation.mutate();
    }
  };

  const handleAmazonClick = () => {
    if (book.amazonUrl) {
      window.open(book.amazonUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddNote = () => {
    if (noteContent.trim()) {
      createMutation.mutate(
        { content: noteContent, bookId: book.id },
        {
          onSuccess: () => {
            setNoteContent('');
          },
        }
      );
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = book.notes?.find((n) => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteContent(note.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingNoteContent.trim()) {
      updateMutation.mutate(
        {
          noteId: editingNoteId,
          data: { content: editingNoteContent },
        },
        {
          onSuccess: () => {
            setEditingNoteId(null);
            setEditingNoteContent('');
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  return (
    <Container maxW='container.xl' p={0}>
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        borderRadius='xl'
        boxShadow='lg'
        overflow='hidden'
        p={{ base: 4, md: 8 }}
      >
        <Grid
          templateColumns={{ base: '1fr', md: '350px 1fr' }}
          gap={{ base: 6, md: 8 }}
        >
          {/* Left Column - Book Details */}
          <VStack align='stretch' gap={6}>
            {book.imageUrl && (
              <Box
                borderRadius='lg'
                overflow='hidden'
                boxShadow='md'
                bg={isDark ? 'gray.700' : 'gray.100'}
                p={4}
              >
                <Image
                  src={book.imageUrl}
                  alt={book.title}
                  width='100%'
                  height='auto'
                  objectFit='cover'
                  borderRadius='md'
                />
              </Box>
            )}
            <VStack align={{ base: 'center', md: 'stretch' }} gap={4}>
              <Heading
                as='h1'
                size='xl'
                letterSpacing='tight'
                textAlign={{ base: 'center', md: 'left' }}
              >
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
              <Text
                fontSize='xl'
                color={isDark ? 'gray.400' : 'gray.600'}
                textAlign={{ base: 'center', md: 'left' }}
              >
                by {book.author}
              </Text>
              {book.categories && (
                <Text
                  fontSize='sm'
                  color={isDark ? 'gray.400' : 'gray.600'}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  Categories: {book.categories}
                </Text>
              )}
              {book.pageCount && (
                <Text
                  fontSize='sm'
                  color={isDark ? 'gray.400' : 'gray.600'}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  Pages: {book.pageCount}
                </Text>
              )}
              {book.description && (
                <Box>
                  <Text
                    color={isDark ? 'gray.300' : 'gray.700'}
                    fontSize='md'
                    lineHeight='tall'
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    {book.description.length > 200 ? (
                      <>
                        {book.description.slice(0, 200)}...{' '}
                        <Button
                          variant='ghost'
                          colorPalette='blue'
                          onClick={() => setIsDescriptionOpen(true)}
                          size='sm'
                        >
                          Read more
                        </Button>
                      </>
                    ) : (
                      book.description
                    )}
                  </Text>
                </Box>
              )}

              <Box width='100%'>
                <StarRating
                  averageRating={book.averageRating}
                  onRate={handleRate}
                  size='lg'
                  totalRatings={book.totalRatings}
                  userRating={book.userRating}
                />
              </Box>

              <Flex
                gap={4}
                mt={4}
                direction={{ base: 'column', sm: 'row' }}
                width='100%'
              >
                {book.amazonUrl && (
                  <Button
                    onClick={handleAmazonClick}
                    colorPalette='orange'
                    color='white'
                    size='xs'
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    <FaAmazon /> View on Amazon
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      onClick={handleFinish}
                      colorPalette='purple'
                      size='xs'
                      width={{ base: '100%', sm: 'auto' }}
                      disabled={finishMutation.isPending}
                    >
                      {' '}
                      <FaCheck />
                      {finishMutation.isPending
                        ? 'Marking as finished...'
                        : 'Mark as Finished'}
                    </Button>
                    <Button
                      colorPalette='red'
                      onClick={() => setIsDeleteDialogOpen(true)}
                      width={{ base: '100%', sm: 'auto' }}
                      size='xs'
                    >
                      <FaTrash /> Delete
                    </Button>
                    <DeleteBookDialog
                      bookId={book.id}
                      groupId={groupId}
                      isOpen={isDeleteDialogOpen}
                      onClose={() => setIsDeleteDialogOpen(false)}
                      title={book.title}
                    />
                  </>
                )}
              </Flex>
            </VStack>
          </VStack>

          {/* Right Column - Notes and Reviews */}
          <VStack align='stretch' gap={8}>
            {/* Notes Section */}
            <Box>
              <Heading as='h2' size='lg' mb={4}>
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

                {book.notes?.map((note) => (
                  <Box
                    key={note.id}
                    p={4}
                    borderWidth={1}
                    borderRadius='lg'
                    bg={isDark ? 'gray.700' : 'gray.50'}
                  >
                    {editingNoteId === note.id ? (
                      <Box>
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) =>
                            setEditingNoteContent(e.target.value)
                          }
                          rows={3}
                          p={4}
                        />
                        <Flex gap={2} mt={2}>
                          <Button
                            colorPalette='green'
                            onClick={handleSaveEdit}
                            disabled={updateMutation.isPending}
                            size='xs'
                          >
                            <FaSave /> Save
                          </Button>
                          <Button
                            colorPalette='gray'
                            onClick={handleCancelEdit}
                            size='xs'
                          >
                            <FaTimes /> Cancel
                          </Button>
                        </Flex>
                      </Box>
                    ) : (
                      <Box>
                        <Flex justify='space-between' align='center' mb={2}>
                          <Text fontWeight='medium'>
                            {note.user.firstName} {note.user.lastName}
                          </Text>
                          {note.user.clerkId === userId && (
                            <Flex gap={2}>
                              <Button
                                size='sm'
                                colorPalette='blue'
                                variant='ghost'
                                onClick={() => handleEditNote(note.id)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                size='sm'
                                colorPalette='red'
                                variant='ghost'
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <FaTimes />
                              </Button>
                            </Flex>
                          )}
                        </Flex>
                        <Text>{note.content}</Text>
                        <Text fontSize='xs' color='gray.500' mt={2}>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Reviews Section */}
            {ratings && ratings.length > 0 && (
              <Box>
                <Heading as='h2' size='lg' mb={4}>
                  Reviews
                </Heading>
                <Stack gap={4}>
                  {ratings.map((rating) => (
                    <ReviewItem key={rating.id} review={rating} />
                  ))}
                </Stack>
              </Box>
            )}
          </VStack>
        </Grid>
      </Box>

      <BookDescriptionModal
        isOpen={isDescriptionOpen}
        onClose={() => setIsDescriptionOpen(false)}
        title={book.title}
        description={book.description || ''}
      />
      <AddBookModal
        groupId={groupId}
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
      />
    </Container>
  );
}
