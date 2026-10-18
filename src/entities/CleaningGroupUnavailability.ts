import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CleaningGroup } from "./CleaningGroup";
import { Congregation } from "./Congregation";

@Entity("cleaning_group_unavailabilities")
export class CleaningGroupUnavailability {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid" })
    congregation_id: string;

    @ManyToOne(() => CleaningGroup, { onDelete: "CASCADE" })
    @JoinColumn({ name: "group_id" })
    group: CleaningGroup;

    @Column({ type: "uuid" })
    group_id: string;

    @Column({ type: "date" })
    startDate: string;

    @Column({ type: "date" })
    endDate: string;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

