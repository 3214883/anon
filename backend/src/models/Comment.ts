import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class Comment {
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

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment | null = null;

  @Column({ nullable: true, type: 'int' })
  parentId: number | null = null;

  @Column('text')
  content: string = '';

  @Column({ default: 0 })
  likeCount: number = 0;

  @Column({ default: false })
  isDeleted: boolean = false;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
