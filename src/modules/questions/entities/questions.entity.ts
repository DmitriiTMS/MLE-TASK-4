import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PollEntity } from "../../polls/entities/polls.entity";
import { QuestionOptionEntity } from "./question-options.entity";



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

}