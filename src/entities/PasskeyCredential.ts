import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity('passkey_credentials')
export class PasskeyCredential {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", name: "user_id" })
    userId: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    // ID da credencial em base64url (identificador único gerado pelo autenticador/dispositivo)
    @Column({ type: "text", unique: true, name: "credential_id" })
    credentialId: string;

    // Chave pública em base64url gerada pelo autenticador
    @Column({ type: "text", name: "public_key" })
    publicKey: string;

    // Contador de assinaturas para prevenção de ataques de repetição (replay attacks)
    @Column({ type: "bigint", default: 0 })
    counter: number;

    // 'singleDevice' ou 'multiDevice' (ex: iCloud Keychain / Google Password Manager)
    @Column({ type: "varchar", length: 32, default: "singleDevice", name: "device_type" })
    deviceType: string;

    // Se a credencial está sincronizada na nuvem do ecossistema do usuário
    @Column({ type: "boolean", default: false, name: "backed_up" })
    backedUp: boolean;

    // JSON array com os transportes suportados (ex: ["internal", "hybrid"])
    @Column({ type: "text", nullable: true })
    transports: string | null;

    // Nome amigável escolhido pelo usuário ou detectado (ex: "iPad Pro", "iPhone de Marcelo")
    @Column({ type: "varchar", length: 120, default: "Chave de Acesso" })
    nickname: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @Column({ type: "timestamp", nullable: true, name: "last_used_at" })
    lastUsedAt: Date | null;
}

