import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Publisher } from "./Publisher";

@Entity('reports')
export class Report{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type:"text"})
    mounth: string

    @Column({type:"text"})
    year: string

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