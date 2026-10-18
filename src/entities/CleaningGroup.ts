import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, ManyToMany, JoinTable
} from "typeorm";
import { Congregation } from "./Congregation";
import { Publisher } from "./Publisher";

@Entity("cleaning_group")
export class CleaningGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  congregation: Congregation;

  @Column({ type: "int" })
  order: number;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "ALL"
  })
  dayPreference: string;

  @ManyToMany(() => Publisher)
  @JoinTable()
  publishers: Publisher[];
}