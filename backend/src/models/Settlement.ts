import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class Settlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizerId' })
  organizer!: User;

  @Column()
  organizerId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'int', default: 0 })
  participantCount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  feeAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  settleAmount!: number;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ nullable: true, type: 'text' })
  rejectReason?: string;

  @Column({ nullable: true })
  approvedBy?: number;

  @Column({ nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  walletTransactionId?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
