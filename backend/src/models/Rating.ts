import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
@Unique(['userId', 'eventId'])
export class Rating {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event = new Event();

  @Column()
  eventId: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @Column({ type: 'int', default: 5 })
  score: number = 5;

  @Column({ type: 'text', nullable: true })
  content: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
