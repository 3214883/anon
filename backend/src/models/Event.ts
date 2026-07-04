import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { ChatMessage } from './ChatMessage';
import { Favorite } from './Favorite';
import { Category } from './Category';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title: string = '';

  @Column('text')
  description: string = '';

  @Column()
  date: Date = new Date();

  @Column({ nullable: true })
  startTime: string = '';

  @Column({ nullable: true })
  endTime: string = '';

  @Column()
  location: string = '';

  @Column({ nullable: true, type: 'text' })
  address: string = '';

  @Column()
  capacity: number = 0;

  @Column({ default: 0 })
  registeredCount: number = 0;

  @Column({ type: 'float', default: 0 })
  price: number = 0;

  @Column({ default: 'draft' })
  status: string = 'draft';

  @Column({ nullable: true })
  coverImage: string = '';

  @Column({ nullable: true })
  category: string = '';

  @Column({ nullable: true })
  categoryId: number | null = null;

  @ManyToOne(() => Category, category => category.events)
  @JoinColumn({ name: 'categoryId' })
  categoryEntity?: Category;

  @Column({ nullable: true })
  tags: string = '';

  @Column({ default: 0 })
  viewCount: number = 0;

  @Column({ default: 0 })
  likeCount: number = 0;

  @Column({ default: 0 })
  favoriteCount: number = 0;

  @Column({ default: 0 })
  commentCount: number = 0;

  @Column({ default: false })
  isSponsored: boolean = false;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizerId' })
  organizer!: User;

  @Column()
  organizerId: number = 0;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @OneToMany(() => ChatMessage, chatMessage => chatMessage.event)
  chatMessages!: ChatMessage[];

  @OneToMany(() => Favorite, favorite => favorite.event)
  favorites!: Favorite[];
}