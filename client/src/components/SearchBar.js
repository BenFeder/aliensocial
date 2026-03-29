import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, getImageUrl } from '../api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const response = await authAPI.searchUsers(query);
        setResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserClick = (username) => {
    navigate(`/${username}`);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Search for friends..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
      />
      {showDropdown && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-result-item">Searching...</div>
          ) : results.length > 0 ? (
            results.map(user => (
              <div
                key={user._id}
                className="search-result-item"
                onClick={() => handleUserClick(user.username)}
              >
                <img
                  src={getImageUrl(user.avatar) || 'https://via.placeholder.com/30'}
                  alt={user.username}
                  className="search-result-avatar"
                />
                <span>{user.username}</span>
              </div>
            ))
          ) : (
            <div className="search-result-item">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
