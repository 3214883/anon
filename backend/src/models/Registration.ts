import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class Registration {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId: number = 0;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventId: number = 0;

  @Column()
  quantity: number = 1;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number = 0;

  @Column()
  contactName: string = '';

  @Column()
  contactPhone: string = '';

  @Column({ default: 'pending' })
  status: string = 'pending';

  @Column({ default: 'unpaid' })
  paymentStatus: string = 'unpaid';

  @Column({ nullable: true })
  orderId: string = '';

  @Column({ default: false })
  isWaitlist: boolean = false;

  @Column({ nullable: true })
  waitlistPosition: number = 0;

  @Column({ unique: true, nullable: true })
  ticketId: string = '';

  @Column({ nullable: true })
  paymentId: number | null = null;

  @Column({ default: 'valid' })
  ticketStatus: string = 'valid';

  @Column({ type: 'datetime', nullable: true })
  checkInTime: Date | null = null;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}