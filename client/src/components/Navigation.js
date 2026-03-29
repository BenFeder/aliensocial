import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav>
      <div className="nav-container">
        <Link to="/" className="logo">AlienSocialNetwork.com</Link>
        <ul className="nav-links">
          {user ? (
            <>
              <li><Link to="/">Feed</Link></li>
              <li><Link to="/create-post">Create Post</Link></li>
              <li><Link to="/pages">Pages</Link></li>
              <li><Link to={`/${user.username}`}>Profile</Link></li>
              <li><button onClick={logout}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
