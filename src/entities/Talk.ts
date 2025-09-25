import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Speaker } from "./Speaker"

@Entity("talks")
export class Talk {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "int", unique: true })
  number: number

  @Column({ type: "text" })
  title: string

  @ManyToMany(() => Speaker, speaker => speaker.talks)
  speakers: Speaker[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
