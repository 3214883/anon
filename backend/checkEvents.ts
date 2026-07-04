import { dataSource } from './src/config/database';
import { Event } from './src/models/Event';

async function checkEvents() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const eventRepository = dataSource.getRepository(Event);
    
    // Get all events
    const allEvents = await eventRepository.find();
    console.log('All events:', allEvents);
    
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkEvents();