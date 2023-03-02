import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Congregation } from "./Congregation";

@Entity('publishers')
export class Publisher{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text'})
    fullName: string

    @Column({type: 'text', nullable: true})
    nickname: string

    @Column({type: 'simple-array', nullable: true})
    privileges: string[]

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({name: 'congregation_id'})
    congregation: Congregation
}