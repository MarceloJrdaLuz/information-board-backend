import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('category')
export class Category{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: "text", nullable: false, unique: true})
    name: string

    @Column({type: "text", nullable: false, unique: true})
    description: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}