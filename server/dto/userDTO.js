// =========================================================================
// User DTO (API boundary serializer)
// =========================================================================
// Centralizes the public user shape so the password hash and other internal
// fields are never serialized to clients.

const serializeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role
});

module.exports = { serializeUser };
