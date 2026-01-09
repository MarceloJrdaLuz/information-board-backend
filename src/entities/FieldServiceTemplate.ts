import {
   Column,
   Entity,
   JoinColumn,
   ManyToOne,
   OneToMany,
   PrimaryGeneratedColumn,
} from "typeorm";
import { Congregation } from "./Congregation";
import { Publisher } from "./Publisher";
import { FieldServiceRotationMember } from "./FieldServiceRotationMember";
import { FieldServiceTemplateLocationOverride } from "./FieldServiceTemplateLocationOverride";

@Entity("field_service_templates")
export class FieldServiceTemplate {
   @PrimaryGeneratedColumn("uuid")
   id: string;

   @Column({ type: "uuid" })
   congregation_id: string;

   @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
   @JoinColumn({ name: "congregation_id" })
   congregation: Congregation;

   /* =========================
      Tipo da saída
   ========================== */
   @Column({
      type: "enum",
      enum: ["FIXED", "ROTATION"],
   })
   type: "FIXED" | "ROTATION";

   /* =========================
      Dia da semana
      0 = Domingo ... 6 = Sábado
   ========================== */
   @Column({ type: "int" })
   weekday: number;

   /* =========================
      Horário
   ========================== */
   @Column({ type: "time" })
   time: string;

   /* =========================
      Local
   ========================== */
   @Column()
   location: string;

   @OneToMany(
      () => FieldServiceTemplateLocationOverride,
      o => o.template
   )
   location_overrides: FieldServiceTemplateLocationOverride[];


   /* =========================
      Dirigente fixo (somente FIXED)
   ========================== */
   @Column({ type: "uuid", nullable: true })
   leader_id: string | null;

   @ManyToOne(() => Publisher, { nullable: true })
   @JoinColumn({ name: "leader_id" })
   leader: Publisher | null;

   /* =========================
      Ativo / inativo
   ========================== */
   @Column({ default: true })
   active: boolean;

   /* =========================
      Rodízio
   ========================== */
   @OneToMany(() => FieldServiceRotationMember, r => r.template, {
      cascade: true,
   })
   rotation_members: FieldServiceRotationMember[];
}
