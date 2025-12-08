import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Congregation } from "./Congregation";

@Entity("cleaning_exception")
export class CleaningException {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  congregation: Congregation;

  @Column({ type: "date" })
  date: string; // formato YYYY-MM-DD

  @Column({ nullable: true })
  reason: string;
}