import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Months } from "../types/enumWeekDays";
import { Congregation } from "./Congregation";

@Entity('totals')
export class TotalsReports {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: "enum", enum: Months })
    month: Months

    @Column({ type: "text" })
    year: string

    @Column({ type: "int" })
    publishersActives: number

    @Column({ type: 'simple-array', nullable: true })
    privileges: string

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @Column({ type: "int" || 'string' })
    hours: number

    @Column({ type: "int", nullable: true })
    studies: number

    @Column({ type: "text" })
    quantity: number

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}