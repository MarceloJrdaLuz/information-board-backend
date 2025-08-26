import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { GroupOverseers } from "./GroupOverseers"
import { Group } from "./Group"
import { EmergencyContact } from "./EmergencyContact"
import { User } from "./User"

export enum Gender {
    Masculino = "Masculino",
    Feminino = "Feminino",
}

export enum Hope {
    Ungido = "Ungido",
    OutrasOvelhas = "Outras ovelhas"
}

export enum Situation {
    Inativo = "Inativo",
    Ativo = "Ativo",
    Removido = "Removido",
    Desassociado = "Desassociado"
}
@Entity('publishers')
export class Publisher {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    fullName: string

    @Column({ type: 'text', nullable: true })
    nickname: string

    @Column({ type: "enum", enum: Hope, default: Hope.OutrasOvelhas })
    hope: Hope

    @Column({
        type: 'enum',
        enum: Situation,
        default: Situation.Ativo,
    })
    situation: Situation

    @Column({
        type: 'enum',
        enum: Gender,
        default: Gender.Masculino,
    })
    gender: Gender

    @Column({ type: 'text', nullable: true })
    phone: string

    @Column({ type: 'text', nullable: true })
    address: string

    @Column({ type: "timestamp", nullable: true })
    dateImmersed: Date

    @Column({ type: "timestamp", nullable: true })
    birthDate: Date

    @Column({ type: "timestamp", nullable: true })
    startPioneer: Date

    @Column({ type: 'simple-array', nullable: true })
    privileges: string[]

    @Column({ type: "simple-array", nullable: true })
    pioneerMonths: string[]

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
        eager: true
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @ManyToOne(() => Group, group => group.publishers, { onDelete: "SET NULL" })
    @JoinColumn({ name: 'group_id' })
    group: Group | null

    @ManyToOne(() => GroupOverseers, { nullable: true, onDelete: "SET NULL" }) // Relacionamento Many-to-One opcional com GroupOverseers
    @JoinColumn({ name: 'group_overseers_id' })
    groupOverseers: GroupOverseers

    @ManyToOne(() => EmergencyContact, emergencyContact => emergencyContact.publishers, {
        eager: true,
        nullable: true,
        onDelete: "SET NULL", // se o contato for deletado, o publisher continua mas sem contato
    })
    emergencyContact: EmergencyContact | null

    @OneToOne(() => User, user => user.publisher, { nullable: true  })
    user: User | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}