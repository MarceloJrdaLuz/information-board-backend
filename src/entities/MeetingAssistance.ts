import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { Months } from "../types/enumWeekDays";

@Entity('assistance')
export class MeetingAssistance{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: "enum", enum: Months })
    month: Months

    @Column({ type: "text" })
    year: string

    @Column({ type: 'simple-array' })
    midWeek: string[]

    @Column({ type: 'int' })
    midWeekTotal: number

    @Column({ type: 'int' })
    midWeekAverage: number

    @Column({ type: 'simple-array' })
    endWeek: string[]

    @Column({ type: 'int' })
    endWeekTotal: number

    @Column({ type: 'int' })
    endWeekAverage: number

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

}