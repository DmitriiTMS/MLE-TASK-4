import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { QuestionEntity } from "../../questions/entities/questions.entity";

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

  @ManyToOne(() => QuestionEntity, (question) => question.questionOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;

}
