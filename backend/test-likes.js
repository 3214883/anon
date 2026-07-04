const { dataSource } = require('./src/config/database');
const { EventLike } = require('./src/models/EventLike');

async function testLikes() {
  try {
    await dataSource.initialize();
    console.log('Database connected');
    
    const eventLikeRepository = dataSource.getRepository(EventLike);
    const likes = await eventLikeRepository.find({
      where: { userId: 0 },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
    
    console.log('Likes found:', likes.length);
    console.log('Likes details:', JSON.stringify(likes, null, 2));
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

testLikes();