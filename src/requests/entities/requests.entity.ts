import { UsersEntity } from 'src/users/entities/users.entities';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'requests' })
export class RequestsEntity {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  to: string;

  @Column()
  type: string;

  @Column()
  currency1: string;

  @Column()
  amount1: string;

  @Column()
  currency2: string;

  @Column()
  amount2: string;

  @ManyToOne(() => UsersEntity, (user) => user.requests, {
    onDelete: 'SET NULL',
  })
  user: UsersEntity;
}
