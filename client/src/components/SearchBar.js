import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, pagesAPI, getImageUrl } from '../api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], pages: [] });
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
    const searchAll = async () => {
      if (query.trim().length < 2) {
        setResults({ users: [], pages: [] });
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const [usersResponse, pagesResponse] = await Promise.all([
          authAPI.searchUsers(query),
          pagesAPI.searchPages(query)
        ]);
        setResults({
          users: usersResponse.data,
          pages: pagesResponse.data
        });
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching:', error);
        setResults({ users: [], pages: [] });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAll, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserClick = (username) => {
    navigate(`/${username}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handlePageClick = (pageId) => {
    navigate(`/pages/${pageId}`);
    setQuery('');
    setShowDropdown(false);
  };

  const hasResults = results.users.length > 0 || results.pages.length > 0;

  return (
    <div className="search-bar-container" ref={searchRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Search for connections and pages"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hasResults && setShowDropdown(true)}
      />
      {showDropdown && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-result-item">Searching...</div>
          ) : hasResults ? (
            <>
              {results.users.length > 0 && (
                <>
                  <div className="search-result-header">Connections</div>
                  {results.users.map(user => (
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
                  ))}
                </>
              )}
              {results.pages.length > 0 && (
                <>
                  <div className="search-result-header">Pages</div>
                  {results.pages.map(page => (
                    <div
                      key={page._id}
                      className="search-result-item"
                      onClick={() => handlePageClick(page._id)}
                    >
                      <img
                        src={getImageUrl(page.avatar) || 'https://via.placeholder.com/30'}
                        alt={page.name}
                        className="search-result-avatar"
                      />
                      <span>{page.name}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="search-result-item">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
