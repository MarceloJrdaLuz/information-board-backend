import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { v4 } from "uuid";
import { Congregation } from "./Congregation";
import { Profile } from "./Profile";
import { Role } from "./Role";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'text', unique: true })
    email: string

    @Column({ type: 'text' })
    password: string

    @Column({ type: "text" })
    code: string

    @ManyToOne(() => Congregation, congregation => congregation.id)
    @JoinColumn({name: 'congregation_id'})
    congregation: Congregation

    @Column({ type: "text", nullable: true })
    passwordResetToken: string

    @Column({ type: "text", nullable: true })
    passwordResetExpires: Date

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

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
}