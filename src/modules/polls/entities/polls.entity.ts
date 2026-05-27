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
import { UserEntity } from '../../users/entities/user.entity';
import { PollResponse } from '../constants/types';
import { QuestionEntity } from '../../questions/entities/questions.entity';

@Entity('polls')
export class PollEntity {
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

    @ManyToOne(() => UserEntity, (user) => user.polls, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'create_user_id' })
    createUser: UserEntity;

    @OneToMany(() => QuestionEntity, (question) => question.poll, { cascade: true })
    questions: QuestionEntity[];

    belongsToUser(userId: number): boolean {
        return this.createUser?.id === userId;
    }

    isPublicStatus(): boolean {
        return this.isPublic === true;
    }

    static createInstance(
        title: string,
        description: string | undefined,
        createUser: UserEntity,
    ): PollEntity {
        const poll = new PollEntity();
        poll.title = title;
        poll.description = description;
        poll.isActive = true;
        poll.isPublic = false;
        poll.createUser = createUser;
        return poll;
    }

    update(data: Partial<Pick<PollEntity, 'title' | 'description' | 'isActive' | 'isPublic'>>): void {
        if (data.title !== undefined) {
            this.title = data.title;
        }
        if (data.description !== undefined) {
            this.description = data.description;
        }
        if (data.isActive !== undefined) {
            this.isActive = data.isActive;
        }
         if (data.isPublic !== undefined) {
            this.isPublic = data.isPublic;
        }
    }

    toResponse() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            isActive: this.isActive,
            isPublic: this.isPublic,
            createUser: {
                id: this.createUser.id,
                name: this.createUser.name,
            },
        };
    }

    static toResponseList(polls: PollEntity[]) {
        return polls.map((poll) => poll.toResponse());
    }


    static fromJSON(data: PollResponse): PollEntity {
        const poll = new PollEntity();
        poll.id = data.id;
        poll.title = data.title;
        poll.description = data.description;
        poll.isActive = data.isActive;
        poll.isPublic = data.isPublic;

        const userEntity = new UserEntity();
        userEntity.id = data.createUser.id;
        userEntity.name = data.createUser.name;
        poll.createUser = userEntity;

        return poll;
    }


    static fromJSONArray(dataArray: PollResponse[]): PollEntity[] {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => this.fromJSON(data));
    }
}
