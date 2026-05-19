import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

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

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    @ManyToOne(() => UserEntity, (user) => user.polls, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'create_user_id' })
    createUser: UserEntity;

    belongsToUser(userId: number): boolean {
        return this.createUser?.id === userId;
    }

    isActiveStatus(): boolean {
        return this.isActive === true;
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
        poll.createUser = createUser;
        return poll;
    }

    update(data: Partial<Pick<PollEntity, 'title' | 'description' | 'isActive'>>): void {
        if (data.title !== undefined) {
            this.title = data.title;
        }
        if (data.description !== undefined) {
            this.description = data.description;
        }
        if (data.isActive !== undefined) {
            this.isActive = data.isActive;
        }
    }

    toResponse() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            isActive: this.isActive,
            createUser: {
                id: this.createUser.id,
                name: this.createUser.name,
            },
        };
    }

    static toResponseList(polls: PollEntity[]) {
        return polls.map((poll) => poll.toResponse());
    }
}
