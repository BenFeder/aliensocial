import React, { useState, useRef, useEffect } from 'react';
import axios, { getImageUrl } from '../api';
import '../styles/MentionInput.css';

const MentionInput = ({ value, onChange, placeholder, className }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  console.log('[MentionInput] Component rendered with:', { 
    value, 
    placeholder, 
    className,
    showDropdown,
    searchQuery,
    suggestionsCount: suggestions.length
  });

  // Search for taggable entities when user types
  useEffect(() => {
    const searchMentions = async () => {
      if (searchQuery === null) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        console.log('[MentionInput] Searching for:', searchQuery);
        const response = await axios.get(`/users/mentions/search?q=${encodeURIComponent(searchQuery)}`);
        console.log('[MentionInput] Search results:', response.data);
        setSuggestions(response.data);
        setShowDropdown(response.data.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error('[MentionInput] Error searching mentions:', error);
        console.error('[MentionInput] Error details:', error.response);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(searchMentions, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setCursorPosition(cursorPos);

    // Check if we should trigger mention search
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    console.log('[MentionInput] Input changed:', { 
      newValue, 
      cursorPos, 
      lastAtSymbol, 
      textBeforeCursor 
    });
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      console.log('[MentionInput] @ detected, textAfterAt:', textAfterAt);
      
      // Only trigger if there's no space after @ and we're still typing
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        console.log('[MentionInput] Setting searchQuery to:', textAfterAt);
        setSearchQuery(textAfterAt);
      } else {
        console.log('[MentionInput] Clearing searchQuery (space found or no text)');
        setSearchQuery(null);
        setShowDropdown(false);
      }
    } else {
      console.log('[MentionInput] No @ found, clearing searchQuery');
      setSearchQuery(null);
      setShowDropdown(false);
    }

    // Clean up mentions if text was deleted
    const updatedMentions = mentions.filter(m => newValue.includes(m.text));
    if (updatedMentions.length !== mentions.length) {
      setMentions(updatedMentions);
      onChange(newValue, updatedMentions);
    } else {
      onChange(newValue, mentions);
    }
  };

  // Handle mention selection
  const selectMention = (mention) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    // Create the mention tag with proper formatting
    const mentionText = mention.type === 'user' 
      ? `@${mention.username || mention.name}` 
      : `@${mention.name}`;
    
    // Create the new text with the mention
    const beforeMention = value.substring(0, lastAtSymbol);
    const newValue = `${beforeMention}${mentionText} ${textAfterCursor}`;
    
    // Store the mention data
    const mentionData = {
      text: mentionText,
      entityId: mention.id,
      type: mention.type,
      username: mention.type === 'user' ? mention.username : undefined
    };
    
    const updatedMentions = [...mentions, mentionData];
    setMentions(updatedMentions);
    onChange(newValue, updatedMentions);

    setShowDropdown(false);
    setSearchQuery(null);

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = lastAtSymbol + mentionText.length + 1;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current.focus();
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showDropdown) {
          e.preventDefault();
          selectMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSearchQuery(null);
        break;
      default:
        break;
    }
  };

  // Get cursor position for dropdown placement
  const getDropdownPosition = () => {
    if (!inputRef.current) return {};
    
    const input = inputRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.font = window.getComputedStyle(input).font;
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.textContent = value.substring(0, lastAtSymbol + 1);
    document.body.appendChild(tempSpan);
    
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    return {
      left: `${Math.min(textWidth, input.offsetWidth - 200)}px`,
      top: '100%'
    };
  };

  return (
    <div className="mention-input-container" style={{ position: 'relative' }}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={4}
      />
      
      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="mention-dropdown"
          style={getDropdownPosition()}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectMention(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <img 
                src={getImageUrl(suggestion.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name || suggestion.username)}&background=39ff14&color=000`}
                alt={suggestion.name || suggestion.username}
                className="mention-avatar"
              />
              <div className="mention-info">
                <div className="mention-name">
                  {suggestion.type === 'user' ? (suggestion.name || suggestion.username) : suggestion.name}
                </div>
                {suggestion.type === 'user' && suggestion.username && (
                  <div className="mention-username">@{suggestion.username}</div>
                )}
                {suggestion.type === 'page' && (
                  <div className="mention-type">Page</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
