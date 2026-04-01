// Helper to fix avatar URLs in production
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Sanitize avatar URL for production
 * Returns null if it's a local path and we're in serverless environment
 */
const sanitizeAvatar = (avatar) => {
  if (!avatar) return null;
  
  // If we're in serverless/production and avatar is a local path, return null
  if (isServerless && avatar.startsWith('/uploads')) {
    return null;
  }
  
  return avatar;
};

/**
 * Sanitize user object - fixes avatar field
 */
const sanitizeUserAvatar = (user) => {
  if (!user) return user;
  
  const userObj = user.toObject ? user.toObject() : user;
  userObj.avatar = sanitizeAvatar(userObj.avatar);
  
  return userObj;
};

/**
 * Sanitize array of users
 */
const sanitizeUsersAvatars = (users) => {
  if (!users) return users;
  return users.map(sanitizeUserAvatar);
};

module.exports = {
  sanitizeAvatar,
  sanitizeUserAvatar,
  sanitizeUsersAvatars
};
