import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Document } from "./Document"
import { Profile } from "./Profile"
import { User } from "./User"

@Entity('congregation')
export class Congregation {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'text'})
    name: string

    @Column({type: 'text', unique: true})
    number: string

    @Column({type: 'text'})
    city: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToMany(() => Profile, profile => profile.congregation)
    @JoinColumn()
    users: User[]
}