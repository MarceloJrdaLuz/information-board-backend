import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { EmergencyContact } from "./EmergencyContact"
import { Group } from "./Group"
import { GroupOverseers } from "./GroupOverseers"
import { HospitalityGroup } from "./HospitalityGroup."
import { User } from "./User"
import { PublisherPrivilege } from "./PublisherPrivilege"

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

    @Column({ type: "date", nullable: true })
    dateImmersed: string

    @Column({ type: "date", nullable: true })
    birthDate: string

    @Column({ type: "date", nullable: true })
    startPioneer: string

    @Column({ type: 'simple-array', nullable: true })
    privileges: string[]

    @OneToMany(() => PublisherPrivilege, pp => pp.publisher)
    privilegesRelation: PublisherPrivilege[]

    @Column({ type: "simple-array", nullable: true })
    pioneerMonths: string[]

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @ManyToOne(() => Group, group => group.publishers, { onDelete: "SET NULL" })
    @JoinColumn({ name: 'group_id' })
    group: Group | null

    @ManyToOne(() => GroupOverseers, { nullable: true, onDelete: "SET NULL" }) // Relacionamento Many-to-One opcional com GroupOverseers
    @JoinColumn({ name: 'group_overseers_id' })
    groupOverseers: GroupOverseers | null

    @ManyToOne(() => EmergencyContact, emergencyContact => emergencyContact.publishers, {
        nullable: true,
        onDelete: "SET NULL", // se o contato for deletado, o publisher continua mas sem contato
    })
    emergencyContact: EmergencyContact | null

    @OneToOne(() => User, user => user.publisher, { nullable: true })
    user: User | null

    @ManyToOne(() => HospitalityGroup, hospitalityGroup => hospitalityGroup.members, {
        nullable: true,
        onDelete: "SET NULL"
    })
    @JoinColumn({ name: "hospitality_group_id" })
    hospitalityGroup: HospitalityGroup | null

    @Column({ type: "uuid", nullable: true })
    hospitality_group_id: string | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}