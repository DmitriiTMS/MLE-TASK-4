import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionEntity } from '../../questions-variant/entities/questions.entity';
import { ICreateOptionResponseData } from '../constants/types';

@Entity('question_options')
export class QuestionOptionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'question_id', nullable: false })
    questionId: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    text: string;

    @Column({ type: 'int', name: 'order_num', nullable: false })
    orderNum: number;

    @ManyToOne(() => QuestionEntity, (question) => question.questionOptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'question_id' })
    question: QuestionEntity;

    static createInstance(
        questionId: number,
        text: string,
        orderNum: number,
    ): QuestionOptionEntity {
        const questionsOption = new QuestionOptionEntity();
        questionsOption.questionId = questionId;
        questionsOption.text = text;
        questionsOption.orderNum = orderNum;
        return questionsOption;
    }

    static toResponse(data: QuestionOptionEntity): ICreateOptionResponseData {
        return {
            id: data.id,
            text: data.text,
            orderNum: data.orderNum,
        };
    }
}
