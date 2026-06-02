import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionModel } from '../../questions-variant/models/questions.model';

@Entity('question_options')
export class QuestionOptionModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'question_id', nullable: false })
    questionId: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    text: string;

    @Column({ type: 'int', name: 'order_num', nullable: false })
    orderNum: number;

    @ManyToOne(() => QuestionModel, (question) => question.questionOptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'question_id' })
    question: QuestionModel;
}
