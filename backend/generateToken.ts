import { generateToken } from './src/utils/jwt';

// Generate token for user with id 1
const token = generateToken(1);
console.log('Generated token:', token);
