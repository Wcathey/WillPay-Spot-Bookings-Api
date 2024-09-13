
module.exports = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8000,
    dbFile: process.env.DB_FILE || 'db/dev.sqlite',
    jwtConfig: {
      secret: process.env.JWT_SECRET || "supersecretkey", //fallback value for JWT_secret
      expiresIn: process.env.JWT_EXPIRES_IN || "1h"
    }
  };
