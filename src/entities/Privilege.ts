import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity("privileges")
export class Privilege {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  name: string 

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
