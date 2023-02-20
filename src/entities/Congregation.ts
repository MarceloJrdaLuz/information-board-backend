import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Document } from "./Document"
import { Notice } from "./Notice"
import { Profile } from "./Profile"
import { User } from "./User"

@Entity('congregation')
export class Congregation {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'text' })
    name: string

    @Column({ type: 'text', unique: true })
    number: string

    @Column({ type: 'text' })
    city: string

    @Column({ type: 'text' })
    circuit: string

    @Column({ type: 'text' })
    imageUrl: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToMany(() => Profile, profile => profile.congregation)
    users: User[]

    @OneToMany(() => Document, document => document.congregation)
    documents: Document[]

    @OneToMany(() => Notice, notice => notice.congregation)
    notices: Notice[]
}