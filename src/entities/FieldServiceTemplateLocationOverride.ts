import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { FieldServiceTemplate } from "./FieldServiceTemplate";

@Entity("field_service_template_location_overrides")
@Index(["template_id", "week_start"], { unique: true })
export class FieldServiceTemplateLocationOverride {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    template_id: string;

    @ManyToOne(() => FieldServiceTemplate, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "template_id" })
    template: FieldServiceTemplate;

    /* =========================
       Início da semana (ISO)
       Sempre segunda-feira
    ========================== */
    @Column({ type: "date" })
    week_start: string;

    /* =========================
       Local alternativo
    ========================== */
    @Column()
    location: string;

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
