import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";

@Entity('polls')
export class PollEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'create_user_id', nullable: false })
    createUserId: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'varchar', length: 3000, nullable: true })
    description: string;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;


    @ManyToOne(() => UserEntity, (user) => user.polls, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'create_user_id' })
    user: UserEntity;

}
