import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
@Unique(['userId', 'eventId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event = new Event();

  @Column()
  eventId: number = 0;

  @CreateDateColumn()
  createdAt: Date = new Date();
}