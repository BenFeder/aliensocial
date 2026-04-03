import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Attempting password reset with token:', token);
      await axios.post(`/users/reset-password/${token}`, {
        password: formData.password
      });
      console.log('Password reset successful');
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired or invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <h1>Password Reset Successful</h1>
        <div className="success-message" style={{ 
          color: '#39ff14', 
          marginBottom: '20px',
          fontSize: '1.1em' 
        }}>
          Your password has been reset successfully!
        </div>
        <p>Redirecting to login page...</p>
        <div className="auth-link">
          <Link to="/login">Click here if not redirected automatically</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1>Reset Your Password</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="At least 6 characters"
        />
        <label>Confirm New Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Re-enter your password"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <div className="auth-link">
        Remember your password? <Link to="/login">Login here</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
