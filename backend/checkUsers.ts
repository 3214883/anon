import { dataSource } from './src/config/database';
import { User } from './src/models/User';

async function checkUsers() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const userRepository = dataSource.getRepository(User);
    
    // Get all users
    const allUsers = await userRepository.find();
    console.log('All users:', allUsers);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkUsers();