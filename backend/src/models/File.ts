import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event | null = null;

  @Column({ nullable: true })
  eventId: number = 0;

  @Column()
  fileName: string = '';

  @Column()
  filePath: string = '';

  @Column()
  fileType: string = '';

  @Column({ type: 'bigint' })
  size: number = 0;

  @CreateDateColumn()
  createdAt: Date = new Date();
}