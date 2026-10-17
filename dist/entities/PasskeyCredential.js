"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasskeyCredential = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let PasskeyCredential = class PasskeyCredential {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", name: "user_id" }),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], PasskeyCredential.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", unique: true, name: "credential_id" }),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", name: "public_key" }),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "publicKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", default: 0 }),
    __metadata("design:type", Number)
], PasskeyCredential.prototype, "counter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, default: "singleDevice", name: "device_type" }),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "deviceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false, name: "backed_up" }),
    __metadata("design:type", Boolean)
], PasskeyCredential.prototype, "backedUp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PasskeyCredential.prototype, "transports", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 120, default: "Chave de Acesso" }),
    __metadata("design:type", String)
], PasskeyCredential.prototype, "nickname", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], PasskeyCredential.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], PasskeyCredential.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "last_used_at" }),
    __metadata("design:type", Object)
], PasskeyCredential.prototype, "lastUsedAt", void 0);
PasskeyCredential = __decorate([
    (0, typeorm_1.Entity)('passkey_credentials')
], PasskeyCredential);
exports.PasskeyCredential = PasskeyCredential;
