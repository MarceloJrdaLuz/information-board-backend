import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { User } from "./User";

@Entity('profile')
export class Profile {

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text" })
    name: string

    @Column({ type: "text" })
    lastName: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Congregation, congregation => congregation.users, { eager: true, nullable: false })
    congregation: Congregation

    @OneToOne(() => User, {eager: true, nullable: false})
    @JoinColumn()
    user: User
}