import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FieldServiceTemplate } from "./FieldServiceTemplate";
import { Publisher } from "./Publisher";

@Entity("field_service_rotation_members")
export class FieldServiceRotationMember {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => FieldServiceTemplate, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "template_id" })
    template: FieldServiceTemplate;

    @Column({ type: "uuid" })
    publisher_id: string;

    @ManyToOne(() => Publisher)
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column()
    order: number;
}
