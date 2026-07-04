const { dataSource } = require('./src/config/database');
const { User } = require('./src/models/User');

async function checkUser() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const userRepository = dataSource.getRepository(User);
    
    // Check if user exists
    const existingUser = await userRepository.findOne({
      where: [{ email: '2132289801@qq.com' }]
    });
    
    console.log('Existing user:', existingUser);
    
    // Get all users
    const allUsers = await userRepository.find();
    console.log('All users:', allUsers);
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkUser();