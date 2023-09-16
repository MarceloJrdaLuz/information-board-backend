import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Publisher } from "./Publisher";
import { Months } from "../types/enumWeekDays";

@Entity('reports')
export class Report{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type:"enum", enum: Months})
    month: Months

    @Column({type:"text"})
    year: string

    @Column({type: "text", nullable: true})
    group: string

    @ManyToOne(() => Publisher, publisher => publisher.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({name: 'publisher_id'})
    publisher: Publisher

    @Column({type:"int", nullable: true})
    publications: number

    @Column({type:"int", nullable: true})
    videos: number

    @Column({type:"int" || 'string'})
    hours: number

    @Column({type:"int", nullable: true})
    revisits: number

    @Column({type:"int", nullable: true})
    studies: number

    @Column({type:"text", nullable: true})
    observations: string
}