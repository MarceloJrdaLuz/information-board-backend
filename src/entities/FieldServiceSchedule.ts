import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FieldServiceTemplate } from "./FieldServiceTemplate";
import { Publisher } from "./Publisher";

@Entity("field_service_schedules")
export class FieldServiceSchedule {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    template_id: string;

    @ManyToOne(() => FieldServiceTemplate, { onDelete: "CASCADE" })
    @JoinColumn({ name: "template_id" })
    template: FieldServiceTemplate;

    @Column({ type: "date" })
    date: string;

    @Column({ type: "uuid" })
    leader_id: string;

    @ManyToOne(() => Publisher)
    @JoinColumn({ name: "leader_id" })
    leader: Publisher;
}
