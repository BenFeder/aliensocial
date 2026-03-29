import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SearchBar from './SearchBar';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav>
      <div className="nav-container">
        <Link to="/" className="logo">AlienSocialNetwork.com</Link>
        {user && <SearchBar />}
        
        {/* Hamburger menu button for mobile */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
          {user ? (
            <>
              <li><Link to="/" onClick={closeMobileMenu}>Feed</Link></li>
              <li><Link to="/pages" onClick={closeMobileMenu}>Pages</Link></li>
              <li><Link to="/connections" onClick={closeMobileMenu}>Connections</Link></li>
              <li><Link to={`/${user.username}`} onClick={closeMobileMenu}>Profile</Link></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={closeMobileMenu}>Login</Link></li>
              <li><Link to="/register" onClick={closeMobileMenu}>Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
