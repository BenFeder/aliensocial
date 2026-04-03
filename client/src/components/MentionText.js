import React from 'react';
import { Link } from 'react-router-dom';

const MentionText = ({ content, mentions = [] }) => {
  if (!content) return null;
  
  // If no mentions, just return the plain text
  if (!mentions || mentions.length === 0) {
    return <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</p>;
  }

  // Find all mentions in the text and create an array of segments
  const segments = [];
  let lastIndex = 0;

  // Sort mentions by their position in the text
  const sortedMentions = [...mentions].sort((a, b) => {
    const aIndex = content.indexOf(a.text);
    const bIndex = content.indexOf(b.text);
    return aIndex - bIndex;
  });

  sortedMentions.forEach((mention) => {
    const mentionIndex = content.indexOf(mention.text, lastIndex);
    
    if (mentionIndex !== -1) {
      // Add text before the mention
      if (mentionIndex > lastIndex) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex, mentionIndex)
        });
      }
      
      // Add the mention
      segments.push({
        type: 'mention',
        content: mention.text,
        entityId: mention.entityId,
        mentionType: mention.type,
        username: mention.username
      });
      
      lastIndex = mentionIndex + mention.text.length;
    }
  });

  // Add any remaining text after the last mention
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  // Render the segments
  return (
    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>;
        } else {
          // Render mention as a styled link
          let linkPath;
          if (segment.mentionType === 'user') {
            // For users, use username from field, or extract from text (e.g., "@BenFeder" -> "BenFeder")
            const username = segment.username || segment.content.replace('@', '');
            linkPath = `/${username}`;
          } else {
            // For pages, use the ID
            linkPath = `/pages/${segment.entityId}`;
          }
          
          return (
            <Link 
              key={index}
              to={linkPath}
            >
              {segment.content}
            </Link>
          );
        }
      })}
    </p>
  );
};

export default MentionText;
