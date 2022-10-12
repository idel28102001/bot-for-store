import { RequestsEntity } from 'src/requests/entities/requests.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column({ default: '' })
  username: string;

  @Column({ nullable: true })
  telegramId: number | null;

  @OneToMany(() => RequestsEntity, (request) => request.user, { cascade: true })
  requests: RequestsEntity[];
}
