import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PollModel } from '../../polls/models/polls.model';

@Entity('users')
export class UserModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ unique: true, length: 255, nullable: false })
    email: string;

    @Exclude()
    @Column({ type: 'varchar', name: 'password_hash', nullable: false })
    passwordHash: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    @Exclude()
    @OneToMany(() => PollModel, (poll) => poll.createUser)
    polls: PollModel[];

}
