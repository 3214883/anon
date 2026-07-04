import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Registration } from './Registration';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @ManyToOne(() => Registration)
  @JoinColumn({ name: 'registrationId' })
  registration!: Registration;

  @Column()
  registrationId!: number;

  @Column({ unique: true })
  ticketNumber!: string;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({ default: 'valid' })
  status!: string;

  @Column({ nullable: true })
  ticketType?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
