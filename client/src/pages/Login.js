import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Attempting login with:', { email: formData.email });
      await login(formData);
      console.log('Login successful, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
    }
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail(formData.email); // Pre-fill with login email if entered
    setForgotPasswordMessage('');
    setForgotPasswordError('');
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordMessage('');
    setIsSubmittingReset(true);

    try {
      console.log('Sending forgot password request to:', '/users/forgot-password');
      console.log('With email:', forgotPasswordEmail);
      
      const response = await axios.post('/users/forgot-password', {
        email: forgotPasswordEmail
      });
      
      console.log('Forgot password response:', response.data);
      setForgotPasswordMessage(response.data.message);
    } catch (err) {
      console.error('Forgot password error full:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.details 
        || err.message 
        || 'Failed to send reset email. Please try again.';
      setForgotPasswordError(errorMessage);
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
    setForgotPasswordError('');
  };

  return (
    <div className="auth-container">
      <h1>Login to AlienSocial</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      <div className="auth-link">
        <button 
          type="button" 
          onClick={handleForgotPasswordClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#39ff14',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '10px'
          }}
        >
          Forgot password?
        </button>
      </div>
      <div className="auth-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <>
          <div className="modal-overlay" onClick={closeForgotPasswordModal}></div>
          <div className="modal">
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="close-btn" onClick={closeForgotPasswordModal}>&times;</button>
            </div>
            <div className="modal-content">
              {forgotPasswordMessage ? (
                <div className="success-message" style={{ color: '#39ff14', marginBottom: '20px' }}>
                  {forgotPasswordMessage}
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit}>
                  <p style={{ marginBottom: '15px' }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  {forgotPasswordError && (
                    <div className="error" style={{ marginBottom: '15px' }}>
                      {forgotPasswordError}
                    </div>
                  )}
                  <label>Email</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                  />
                  <button type="submit" disabled={isSubmittingReset}>
                    {isSubmittingReset ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
