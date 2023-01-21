import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";

@Entity('notices')
export class Notice{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text'})
    title: string

    @Column({type: 'text'})
    text: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Congregation, congregation => congregation.users, { eager: true, nullable: false, onDelete: "CASCADE" })
    @JoinColumn({name: 'congregation_id'})
    congregation: Congregation
}