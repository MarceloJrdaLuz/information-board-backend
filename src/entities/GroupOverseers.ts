import {  CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Publisher } from "./Publisher"

@Entity('groupOverseers')
export class GroupOverseers {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Publisher, publisher => publisher.groupOverseers, {eager: true, onDelete: "SET NULL"}) // Relacionamento Many-to-One com Publisher
    @JoinColumn({ name: 'publisher_id' })
    publisher: Publisher | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

}