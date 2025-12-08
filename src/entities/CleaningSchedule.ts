import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { CleaningGroup } from "./CleaningGroup";

@Entity("cleaning_schedule")
export class CleaningSchedule {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Congregation)
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column()
    congregation_id: string;

    @ManyToOne(() => CleaningGroup)
    @JoinColumn({ name: "group_id" })
    group: CleaningGroup;

    @Column()
    group_id: string;

    @Column({ type: "date" })
    date: string;
}
