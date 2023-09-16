import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Document } from "./Document"
import { Notice } from "./Notice"
import { User } from "./User"
import { EndweekDays, MidweekDays } from "../types/enumWeekDays"
import { Group } from "./Group"

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

    @Column({ type: "enum", enum: MidweekDays, nullable: true })
    dayMeetingLifeAndMinistary: MidweekDays

    @Column({ type: "time", nullable: true })
    hourMeetingLifeAndMinistary: string

    @Column({ type: "enum", enum: EndweekDays, nullable: true })
    dayMeetingPublic: EndweekDays

    @Column({ type: "time", nullable: true })
    hourMeetingPublic: string

    @Column({ type: 'text', nullable:true })
    image_url: string

    @Column({ type: "text", nullable: true})
    imageKey: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToMany(() => User, user => user.congregation)
    @OneToMany(() => User, user => user.congregation)
    users: User[]

    @OneToMany(() => Document, document => document.congregation)
    documents: Document[]

    @OneToMany(() => Notice, notice => notice.congregation)
    notices: Notice[]

    @OneToMany(() => Group, group => group.groupOverseers, { nullable: true}) // Relacionamento One-to-Many com Group (opcional)
    groups: Group[]
}