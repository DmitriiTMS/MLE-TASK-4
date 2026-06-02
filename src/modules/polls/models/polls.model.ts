import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { QuestionModel } from '../../questions/questions-variant/models/questions.model';
import { UserModel } from '../../users/models/user.model';

@Entity('polls')
export class PollModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'varchar', length: 3000, nullable: true })
    description?: string;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', name: 'is_public', default: false })
    isPublic: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    @ManyToOne(() => UserModel, (user) => user.polls, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'create_user_id' })
    createUser: UserModel;

    @OneToMany(() => QuestionModel, (question) => question.poll, { cascade: true })
    questions: QuestionModel[];
}
