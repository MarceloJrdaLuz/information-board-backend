import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { HospitalityWeekend } from "./HospitalityWeekend"
import { HospitalityGroup } from "./HospitalityGroup."
import { HospitalityEventType } from "../types/hospitality"

@Entity("hospitality_assignment")
export class HospitalityAssignment {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => HospitalityWeekend, weekend => weekend.assignments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "weekend_id" })
    weekend: HospitalityWeekend

    @Column({ type: "enum", enum: HospitalityEventType })
    eventType: HospitalityEventType

    @ManyToOne(() => HospitalityGroup, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "group_id" })
    group: HospitalityGroup | null

    @Column({ type: "boolean", nullable: true, default: null })
    completed: boolean | null;

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
