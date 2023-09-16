import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { User } from "./User";

@Entity('profile')
export class Profile {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "text" })
    name: string

    @Column({ type: "text" })
    lastName: string

    @Column({type: "text"})
    avatar_url: string

    @Column({type: "text"})
    avatar_bucket_key: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToOne(() => User, {eager: true, nullable: false, onDelete: "CASCADE"})
    @JoinColumn({name: 'user_id'})
    user: User
}