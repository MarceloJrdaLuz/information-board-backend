import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Publisher } from "./Publisher"

@Entity('groupOverseers')
export class GroupOverseers {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Publisher, publisher => publisher.groupOverseers, {eager: true}) // Relacionamento Many-to-One com Publisher
    @JoinColumn({ name: 'publisher_id' })
    publisher: Publisher

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

}