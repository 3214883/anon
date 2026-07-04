import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Friend {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User = new User();

  @Column()
  userId: number = 0;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'friendId' })
  friend: User = new User();

  @Column()
  friendId: number = 0;

  @Column({ default: 'pending' })
  status: string = 'pending';

  @Column({ nullable: true })
  remark: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
