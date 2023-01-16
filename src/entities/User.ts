import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { Profile } from "./Profile";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'text', unique: true })
    email: string

    @Column({type: 'text'})
    password: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date


    // permission: string
}