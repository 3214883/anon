import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  type: string = '';

  @Column()
  title: string = '';

  @Column('text')
  content: string = '';

  @Column({ default: false })
  isRead: boolean = false;

  @CreateDateColumn()
  createdAt: Date = new Date();
}