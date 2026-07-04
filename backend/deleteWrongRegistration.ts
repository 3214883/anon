import { dataSource } from './src/config/database';
import { Registration } from './src/models/Registration';

async function deleteWrongRegistration() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const registrationRepository = dataSource.getRepository(Registration);
    
    // Delete the wrong registration
    await registrationRepository.delete({
      userId: 0,
      eventId: 0
    });
    
    console.log('Wrong registration deleted successfully');
    
  } catch (error) {
    console.error('Error deleting wrong registration:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

deleteWrongRegistration();