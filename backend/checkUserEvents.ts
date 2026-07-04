import { dataSource } from './src/config/database';
import { Event } from './src/models/Event';

async function checkUserEvents() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    const eventRepository = dataSource.getRepository(Event);
    
    // Get all events
    const allEvents = await eventRepository.find();
    console.log('All events:', allEvents);
    
    // Get events with status 'published'
    const publishedEvents = await eventRepository.find({
      where: { status: 'published' }
    });
    console.log('Published events:', publishedEvents);
    
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

checkUserEvents();