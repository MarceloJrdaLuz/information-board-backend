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

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Congregation, congregation => congregation.users, { eager: true, nullable: false, onDelete: "CASCADE" })
    @JoinColumn({name: 'congregation_id'})
    congregation: Congregation

    @OneToOne(() => User, {eager: true, nullable: false, onDelete: "CASCADE"})
    @JoinColumn({name: 'user_id'})
    user: User
}