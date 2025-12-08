import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn
} from "typeorm";
import { Congregation } from "./Congregation";
import { CleaningScheduleMode } from "../types/cleaning";

@Entity("cleaning_schedule_config")
export class CleaningScheduleConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => Congregation, { onDelete: "CASCADE" })
  @JoinColumn()
  congregation: Congregation;

  @Column({
    type: "enum",
    enum: CleaningScheduleMode,
    default: CleaningScheduleMode.WEEKLY
  })
  mode: CleaningScheduleMode;
}