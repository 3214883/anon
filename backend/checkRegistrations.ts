import { dataSource } from './src/config/database';
import { Registration } from './src/models/Registration';

async function checkRegistrations() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const registrationRepository = dataSource.getRepository(Registration);
    
    // Get all registrations
    const allRegistrations = await registrationRepository.find();
    console.log('All registrations:', allRegistrations);
    
  } catch (error) {
    console.error('Error checking registrations:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkRegistrations();