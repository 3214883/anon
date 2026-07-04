import { dataSource } from './src/config/database';
import { User } from './src/models/User';

async function checkUserPhone() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const userRepository = dataSource.getRepository(User);
    
    // Check if user with empty phone exists
    const existingUser = await userRepository.findOne({
      where: [{ phone: '' }]
    });
    
    console.log('Existing user with empty phone:', existingUser);
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkUserPhone();