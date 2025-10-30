import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity("terms_of_use")
export class TermsOfUse {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 50 })
  type: "congregation" | "publisher"

  @Column({ type: "varchar", length: 10 })
  version: string

  @Column({ type: "varchar", length: 255 })
  title: string

  @Column({ type: "text" })
  content: string // markdown 

  @Column({ type: "boolean", default: false })
  is_active: boolean

  @CreateDateColumn()
  created_at: Date
}
