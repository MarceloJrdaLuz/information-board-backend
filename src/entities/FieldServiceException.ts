import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FieldServiceTemplate } from "./FieldServiceTemplate";
import { Congregation } from "./Congregation";

@Entity("field_service_exceptions")
@Index(["date"])
@Index(["congregation_id", "date"])
@Index(["template_id", "date"])
export class FieldServiceException {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /* =========================
       Congregação (OBRIGATÓRIO)
    ========================== */
    @Column({ type: "uuid" })
    congregation_id: string;

    @ManyToOne(() => Congregation)
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    /* =========================
       Template (OPCIONAL)
    ========================== */
    @Column({ type: "uuid", nullable: true })
    template_id?: string;

    @ManyToOne(() => FieldServiceTemplate, { nullable: true })
    @JoinColumn({ name: "template_id" })
    template?: FieldServiceTemplate;

    /* =========================
       Data
    ========================== */
    @Column({ type: "date" })
    date: string;

    /* =========================
       Motivo
    ========================== */
    @Column({ nullable: true })
    reason?: string;
}
