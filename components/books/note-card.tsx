import { Box, Button, Flex, Text, Textarea } from '@chakra-ui/react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { ReactionPicker } from '@/components/ui/reaction-picker';
import { CommentReply } from '@/components/comments/comment-reply';
import type { NoteWithUser, CommentWithUser } from '@/types';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { useComments } from '@/hooks/useComments';

interface NoteCardProps {
  note: NoteWithUser;
  groupId: string;
  bookId: string;
  userId: string;
}

export function NoteCard({ note, groupId, bookId, userId }: NoteCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const { updateMutation, deleteMutation } = useNoteMutations(bookId, groupId);
  const {
    createMutation: createCommentMutation,
    deleteMutation: deleteCommentMutation,
  } = useComments(groupId);

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(note.content);
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

  const handleAddComment = (noteId: string) => {
    if (commentContent.trim()) {
      createCommentMutation.mutate(
        { content: commentContent, noteId },
        {
          onSuccess: () => {
            setCommentContent('');
          },
        }
      );
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <Box
      p={4}
      borderWidth={1}
      borderRadius='lg'
      bg={isDark ? 'gray.700' : 'gray.50'}
    >
      {editingNoteId === note.id ? (
        <Box>
          <Textarea
            value={editingNoteContent}
            onChange={(e) => setEditingNoteContent(e.target.value)}
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
            <Button colorPalette='gray' onClick={handleCancelEdit} size='xs'>
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
          <Flex gap={4} mt={2} align='center'>
            <Text fontSize='xs' color='gray.500'>
              {new Date(note.createdAt).toLocaleDateString()}
            </Text>
            <ReactionPicker
              groupId={groupId}
              noteId={note.id}
              existingReactions={note.reactions ?? []}
              currentUserId={userId}
            />
          </Flex>
          {note.comments?.length > 0 && (
            <Box mt={4}>
              {note.comments.map((comment: CommentWithUser) => (
                <Box key={comment.id} mb={4}>
                  <CommentReply
                    comment={comment}
                    groupId={groupId}
                    noteId={note.id}
                    userId={userId}
                    onDelete={handleDeleteComment}
                  />
                </Box>
              ))}
            </Box>
          )}
          <Box mt={2}>
            <Textarea
              placeholder='Add a comment...'
              size='sm'
              rows={2}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <Button
              mt={2}
              size='xs'
              colorPalette='purple'
              onClick={() => handleAddComment(note.id)}
              disabled={!commentContent.trim()}
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
