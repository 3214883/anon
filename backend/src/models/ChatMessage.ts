import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Event } from './Event';
import { User } from './User';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId: number = 0;

  @Column()
  userId: number = 0;

  @Column('text')
  content: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @ManyToOne(() => Event, event => event.chatMessages)
  event!: Event;

  @ManyToOne(() => User, user => user.chatMessages)
  user!: User;
}
