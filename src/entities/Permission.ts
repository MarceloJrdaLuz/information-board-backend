import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('permissions')
export class Permission{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text', unique: true})
    name: string

    @Column({type: 'text'})
    description: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}