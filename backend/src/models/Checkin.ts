import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';
import { Ticket } from './Ticket';

@Entity()
export class Checkin {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket!: Ticket;

  @Column()
  ticketId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventId!: number;

  @Column({ type: 'datetime' })
  checkinTime!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
