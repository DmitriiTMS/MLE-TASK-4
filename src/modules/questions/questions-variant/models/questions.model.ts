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
import { QuestionOptionModel } from '../../question-options/models/question-options.model';
import { PollModel } from '../../../polls/models/polls.model';

export type QuestionType = 'single' | 'multiple';

@Entity('questions')
export class QuestionModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'poll_id', nullable: false })
    pollId: number;

    @Column({ type: 'text', nullable: false })
    text: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    type: QuestionType;

    @Column({ type: 'int', name: 'order_num', nullable: false })
    orderNum: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    @ManyToOne(() => PollModel, (poll) => poll.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'poll_id' })
    poll: PollModel;

    @OneToMany(() => QuestionOptionModel, (option) => option.question, { cascade: true })
    questionOptions: QuestionOptionModel[];

}
