import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from "./Permission";

@Entity('roles')
export class Role{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'text', unique: true})
    name: string

    @Column({type: 'text'})
    description: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToMany(() => Permission)
    @JoinTable({
        name: 'permissions_roles',
        joinColumns:[{
            name: 'role_id'
        }],
        inverseJoinColumns:[{
            name: 'permission_id',
        }]
    })
    permissions: Permission[]
}