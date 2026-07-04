import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './Chat';
import { User } from './User';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => Chat)
  @JoinColumn({ name: 'chatId' })
  chat: Chat = new Chat();

  @Column()
  chatId: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @Column('text')
  content: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();
}