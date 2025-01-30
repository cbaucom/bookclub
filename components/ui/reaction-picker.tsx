import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { FaRegSmile } from 'react-icons/fa';
import { useReactions } from '@/hooks/useReactions';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import type { ReactionWithUser } from '@/types';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ReactionPickerProps {
  groupId: string;
  noteId?: string;
  commentId?: string;
  existingReactions: ReactionWithUser[];
  currentUserId: string;
}

export function ReactionPicker({
  groupId,
  noteId,
  commentId,
  existingReactions,
  currentUserId,
}: ReactionPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { createMutation, deleteMutation } = useReactions(groupId);
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = async (emoji: string) => {
    const existingReaction = existingReactions.find(
      (r) => r.emoji === emoji && r.user.clerkId === currentUserId
    );

    if (existingReaction) {
      deleteMutation.mutate(existingReaction.id);
    } else {
      createMutation.mutate({
        emoji,
        ...(noteId ? { noteId } : {}),
        ...(commentId ? { commentId } : {}),
      });
    }
    setIsOpen(false);
  };

  const groupedReactions = existingReactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, typeof existingReactions>
  );

  return (
    <Flex gap={2} align='center' wrap='wrap'>
      {Object.entries(groupedReactions).map(([emoji, reactions]) => (
        <Button
          key={emoji}
          size='xs'
          variant={
            reactions.some((r) => r.user.clerkId === currentUserId)
              ? 'subtle'
              : 'outline'
          }
          onClick={() => handleEmojiClick(emoji)}
          colorPalette='purple'
          title={reactions
            .map((r) => `${r.user.firstName} ${r.user.lastName}`)
            .join(', ')}
        >
          {emoji} {reactions.length}
        </Button>
      ))}
      <Box position='relative'>
        <IconButton
          aria-label='Add reaction'
          size='xs'
          variant='ghost'
          colorPalette='gray'
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaRegSmile />
        </IconButton>
        {isOpen && (
          <Box
            position='absolute'
            top='-120px'
            left='0'
            zIndex={1}
            bg={isDark ? 'gray.800' : 'white'}
            borderRadius='md'
            boxShadow='lg'
            p={2}
          >
            <Flex gap={2} wrap='wrap' width='150px'>
              {EMOJI_LIST.map((emoji) => (
                <Box
                  key={emoji}
                  as='button'
                  p={2}
                  borderRadius='md'
                  _hover={{ bg: isDark ? 'gray.700' : 'gray.100' }}
                  onClick={() => handleEmojiClick(emoji)}
                >
                  <Text fontSize='lg'>{emoji}</Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
