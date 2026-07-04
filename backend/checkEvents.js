const { dataSource } = require('./src/config/database');
const { Event } = require('./src/models/Event');

async function checkEvents() {
  try {
    await dataSource.initialize();
    const eventRepository = dataSource.getRepository(Event);
    
    const events = await eventRepository.find({
      order: { createdAt: 'DESC' }
    });
    
    console.log('Total events:', events.length);
    console.log('\nEvent details:');
    events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`ID: ${event.id}`);
      console.log(`Title: ${event.title}`);
      console.log(`Organizer ID: ${event.organizerId}`);
      console.log(`Status: ${event.status}`);
      console.log(`Created At: ${event.createdAt}`);
    });
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error checking events:', error);
  }
}

checkEvents();