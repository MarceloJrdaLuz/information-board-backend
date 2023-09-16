import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "./Category";
import { Congregation } from "./Congregation";

@Entity('documents')
export class Document {

    @PrimaryGeneratedColumn('uuid')
    id: string

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

    @ManyToOne(() => Category, category => category.id, {eager: true})
    @JoinColumn({name: 'category_id'})
    category: Category

    @ManyToOne(() => Congregation, congregation => congregation.documents, {
        eager: true,
        onDelete: "CASCADE"
    })
    @JoinColumn({name: 'congregation_id'})
    congregation: Congregation
}
