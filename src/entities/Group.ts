import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { GroupOverseers } from "./GroupOverseers";
import { Congregation } from "./Congregation";
import { Publisher } from "./Publisher";


@Entity('group')
export class Group {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    name: string

    @Column({ type: 'text' })
    number: string

    @ManyToOne(() => Congregation, congregation => congregation.groups) // Relacionamento Many-to-One com Congregation
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation;

    @OneToMany(() => Publisher, publisher => publisher.group)
    publishers: Publisher[]

    @ManyToOne(() => GroupOverseers, { eager: true, nullable: true, onDelete: "SET NULL" }) // Relacionamento Many-to-One com GroupOverseers
    @JoinColumn({ name: 'group_overseers_id' })
    groupOverseers: GroupOverseers | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

}