import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ unique: true, length: 255, nullable: false })
    email: string;

    @Column({ type: 'varchar', name: 'password_hash', nullable: false, select: false})
    passwordHash: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    static createInstance(name: string, email: string, passwordHash: string): UserEntity {
        const user = new UserEntity();
        user.name = name;
        user.email = email;
        user.passwordHash = passwordHash;
        return user;
    }
}
