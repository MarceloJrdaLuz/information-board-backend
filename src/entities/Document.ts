import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "./Category";
import { Congregation } from "./Congregation";

@Entity('documents')
export class Document {

    @PrimaryGeneratedColumn('uuid')
    id: number

    @Column({ type: "text" })
    fileName: string

    @Column({ type: "text" })
    size: number

    @Column({ type: "text" })
    key: string

    @Column({ type: "text" })
    url: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Category, category => category.id)
    category: Category     
}
