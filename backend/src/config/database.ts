import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { ChatMessage } from '../models/ChatMessage';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { Favorite } from '../models/Favorite';
import { EventLike } from '../models/EventLike';
import { Comment } from '../models/Comment';
import { Rating } from '../models/Rating';
import { Ticket } from '../models/Ticket';
import { Checkin } from '../models/Checkin';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { Settlement } from '../models/Settlement';
import { Category } from '../models/Category';

// Load environment variables
dotenv.config();

// Create TypeORM data source
const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Event, Registration, ChatMessage, Payment, Notification, Favorite, EventLike, Comment, Rating, Ticket, Checkin, Wallet, WalletTransaction, Settlement, Category],
  synchronize: true, // Auto-create tables in development
  logging: true,
});

import { seedEvents } from '../utils/seedData';

// Initialize database and insert default data
const initDatabase = async () => {
  await dataSource.initialize();
  
  // Insert default users if none exist
  const userRepository = dataSource.getRepository('User');
  const userCount = await userRepository.count();
  
  if (userCount === 0) {
    const user1 = userRepository.create({
      username: '杨硕',
      email: 'admin@example.com',
      phone: '13800138000',
      password: 'admin123',
      role: 'admin',
    });
    
    const user2 = userRepository.create({
      username: '管理员',
      email: 'user@example.com',
      phone: '13800138001',
      password: 'user123',
      role: 'user',
    });
    
    await userRepository.save([user1, user2]);
    console.log('Default users inserted');
  }
  
  // Update existing users with null username
  const usersWithNullUsername = await userRepository.find({
    where: { username: null }
  });
  
  for (const user of usersWithNullUsername) {
    user.username = user.email.split('@')[0];
    await userRepository.save(user);
  }
  
  if (usersWithNullUsername.length > 0) {
    console.log(`Updated ${usersWithNullUsername.length} users with null username`);
  }
  
  // Insert seed events
  await seedEvents();
};

export { dataSource, initDatabase };