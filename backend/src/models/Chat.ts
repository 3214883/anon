import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './Event';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event = new Event();

  @Column()
  eventId: number = 0;

  @Column()
  name: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}