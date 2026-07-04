import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessage } from './ChatMessage';
import { Favorite } from './Favorite';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  username!: string;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  avatar!: string;

  @Column({ nullable: true, type: 'text' })
  coverImage!: string;

  @Column({ nullable: true })
  gender!: string;

  @Column({ nullable: true })
  birthday!: Date;

  @Column({ nullable: true, type: 'text' })
  bio!: string;

  @Column({ nullable: true })
  location!: string;

  @Column({ nullable: true })
  contact!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ default: 'user' })
  role!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChatMessage, chatMessage => chatMessage.user)
  chatMessages!: ChatMessage[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites!: Favorite[];
}
