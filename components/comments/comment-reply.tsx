import { Box, Button, Flex, Text, Textarea } from '@chakra-ui/react';
import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useTheme } from 'next-themes';
import { ReactionPicker } from '@/components/ui/reaction-picker';
import type { CommentWithUser } from '@/types';
import { FaTimes } from 'react-icons/fa';

interface CommentReplyProps {
  comment: CommentWithUser;
  groupId: string;
  noteId: string;
  userId: string;
  onDelete: (commentId: string) => void;
}

export function CommentReply({
  comment,
  groupId,
  noteId,
  userId,
  onDelete,
}: CommentReplyProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { createMutation } = useComments(groupId);

  const handleReply = () => {
    if (replyContent.trim()) {
      createMutation.mutate(
        {
          content: replyContent,
          noteId,
          parentId: comment.id,
        },
        {
          onSuccess: () => {
            setReplyContent('');
            setIsReplying(false);
          },
        }
      );
    }
  };

  return (
    <Box
      pl={4}
      borderLeftWidth={2}
      borderColor={isDark ? 'gray.600' : 'gray.200'}
    >
      <Flex justify='space-between' align='center' mb={1}>
        <Text fontSize='sm' fontWeight='medium'>
          {comment.user.firstName} {comment.user.lastName}
        </Text>
        {comment.user.clerkId === userId && (
          <Button
            size='xs'
            colorPalette='red'
            variant='ghost'
            onClick={() => onDelete(comment.id)}
          >
            <FaTimes />
          </Button>
        )}
      </Flex>
      <Text fontSize='sm'>{comment.content}</Text>
      <Flex gap={4} mt={1} align='center'>
        <Text fontSize='xs' color='gray.500'>
          {new Date(comment.createdAt).toLocaleDateString()}
        </Text>
        <ReactionPicker
          groupId={groupId}
          commentId={comment.id}
          existingReactions={comment.reactions}
          currentUserId={userId}
        />
        <Button
          size='xs'
          variant='ghost'
          onClick={() => setIsReplying(!isReplying)}
        >
          Reply
        </Button>
      </Flex>

      {isReplying && (
        <Box mt={2}>
          <Textarea
            placeholder='Write a reply...'
            size='sm'
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <Flex gap={2} mt={2}>
            <Button
              size='xs'
              colorPalette='purple'
              onClick={handleReply}
              disabled={!replyContent.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Replying...' : 'Reply'}
            </Button>
            <Button
              size='xs'
              variant='ghost'
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
            >
              Cancel
            </Button>
          </Flex>
        </Box>
      )}

      {comment.replies?.map((reply) => (
        <CommentReply
          key={reply.id}
          comment={reply}
          groupId={groupId}
          noteId={noteId}
          userId={userId}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
