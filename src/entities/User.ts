import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { Profile } from "./Profile";
import { Publisher } from "./Publisher";
import { Role } from "./Role";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'text', unique: true })
    email: string

    @Column({ type: 'text' })
    password: string

    @Column({ type: 'text', nullable: true })
    fullName: string

    @Column({ type: "text" })
    code: string

    @ManyToOne(() => Congregation, congregation => congregation.id, { eager: true })
    @JoinColumn({ name: 'congregation_id', })
    congregation: Congregation

    @Column({ type: "text", nullable: true })
    passwordResetToken: string

    @Column({ type: "text", nullable: true })
    passwordResetExpires: Date

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToOne(() => Profile)
    @JoinColumn({ name: 'profile_id' })
    profile: Profile

    @ManyToMany(() => Role, { eager: true })
    @JoinTable({
        name: 'user_roles',
        joinColumns: [{
            name: 'user_id'
        }],
        inverseJoinColumns: [{
            name: 'role_id',
        }],
    })
    roles: Role[]

    @OneToOne(() => Publisher, { nullable: true, onDelete: "SET NULL", eager: true })
    @JoinColumn({ name: 'publisher_id' })
    publisher: Publisher | null
}