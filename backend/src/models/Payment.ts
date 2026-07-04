import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './User';
import { Registration } from './Registration';
import { Event } from './Event';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @OneToOne(() => Registration)
  @JoinColumn({ name: 'registrationId' })
  registration: Registration = new Registration();

  @Column()
  registrationId: number = 0;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event = new Event();

  @Column()
  eventId: number = 0;

  @Column({ type: 'float' })
  amount: number = 0;

  @Column({ nullable: true })
  paymentMethod: string = '';

  @Column({ nullable: true })
  transactionId: string = '';

  @Column({ default: 'pending' })
  status: string = 'pending';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}