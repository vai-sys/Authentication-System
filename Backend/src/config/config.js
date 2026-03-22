

const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  
  "EMAIL_USER",
  "EMAIL_PASS"
];


requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(` Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS:process.env.EMAIL_PASS
};

module.exports = config;