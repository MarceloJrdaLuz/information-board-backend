import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { GroupOverseers } from "./GroupOverseers";

export enum Gender {
    Masculino = "Masculino",
    Feminino = "Feminino",
}

export enum Hope {
    Ungido = "Ungido", 
    OutrasOvelhas = "Outras ovelhas"
}
@Entity('publishers')
export class Publisher {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    fullName: string

    @Column({ type: 'text', nullable: true })
    nickname: string

    @Column({type: "enum", enum: Hope ,default: Hope.OutrasOvelhas })
    hope: Hope

    @Column({
        type: 'enum',
        enum: Gender,
        default: Gender.Masculino,
    })
    gender: Gender

    @Column({type: 'text', nullable: true })
    phone: string

    @Column({type: "timestamp", nullable: true})
    dateImmersed: Date

    @Column({ type: 'simple-array', nullable: true })
    privileges: string[]

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
        eager: true
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @ManyToOne(() => GroupOverseers, { nullable: true }) // Relacionamento Many-to-One opcional com GroupOverseers
    @JoinColumn({ name: 'group_overseers_id' })
    groupOverseers: GroupOverseers;
}