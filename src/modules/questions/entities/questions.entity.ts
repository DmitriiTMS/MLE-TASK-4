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
import { PollEntity } from '../../polls/entities/polls.entity';
import { IResponseQuestion } from '../constants/types';
import { QuestionOptionEntity } from '../../question-options/entities/question-options.entity';

export type QuestionType = 'single' | 'multiple';

@Entity('questions')
export class QuestionEntity {
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

    @ManyToOne(() => PollEntity, (poll) => poll.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'poll_id' })
    poll: PollEntity;

    @OneToMany(() => QuestionOptionEntity, (option) => option.question, { cascade: true })
    questionOptions: QuestionOptionEntity[];

    static createInstance(
        pollId: number,
        text: string,
        orderNum: number,
        type: QuestionType,
    ): QuestionEntity {
        const question = new QuestionEntity();
        question.pollId = pollId;
        question.text = text;
        question.orderNum = orderNum;
        question.type = type;
        return question;
    }

    static updateWithOptions(
        question: {
            id: number,
            pollId: number,
            text?: string,
            type?: QuestionType,
            orderNum?: number,
            questionOptions: {
                id: number,
                text?: string;
                orderNum?: number;
            }[]
        },
    ): QuestionEntity {
        const updatedQuestion = new QuestionEntity();
        updatedQuestion.id = question.id;
        updatedQuestion.pollId = question.pollId;
        if (question.text) {
            updatedQuestion.text = question.text;
        }
        if (question.type) {
            updatedQuestion.type = question.type;
        }
        if (question.orderNum) {
            updatedQuestion.orderNum = question.orderNum;
        }

        updatedQuestion.questionOptions = question.questionOptions.map(opt => {
            const option = new QuestionOptionEntity();
            option.id = opt.id;
            if (opt.text) {
                option.text = opt.text;
            }
            if (opt.orderNum) {
                option.orderNum = opt.orderNum;
            }
            return option;
        });

        return updatedQuestion;
    }

    static toResponse(data: QuestionEntity): IResponseQuestion {
        return {
            id: data.id,
            pollId: data.pollId,
            text: data.text,
            type: data.type,
            orderNum: data.orderNum,
            questionOptions: data.questionOptions.map((option) => {
                return {
                    id: option.id,
                    text: option.text,
                    orderNum: option.orderNum,
                };
            }),
        };
    }
}
