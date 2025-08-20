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
exports.Publisher = exports.Situation = exports.Hope = exports.Gender = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const GroupOverseers_1 = require("./GroupOverseers");
const Group_1 = require("./Group");
const EmergencyContact_1 = require("./EmergencyContact");
var Gender;
(function (Gender) {
    Gender["Masculino"] = "Masculino";
    Gender["Feminino"] = "Feminino";
})(Gender = exports.Gender || (exports.Gender = {}));
var Hope;
(function (Hope) {
    Hope["Ungido"] = "Ungido";
    Hope["OutrasOvelhas"] = "Outras ovelhas";
})(Hope = exports.Hope || (exports.Hope = {}));
var Situation;
(function (Situation) {
    Situation["Inativo"] = "Inativo";
    Situation["Ativo"] = "Ativo";
    Situation["Removido"] = "Removido";
    Situation["Desassociado"] = "Desassociado";
})(Situation = exports.Situation || (exports.Situation = {}));
let Publisher = class Publisher {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Publisher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Publisher.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Publisher.prototype, "nickname", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: Hope, default: Hope.OutrasOvelhas }),
    __metadata("design:type", String)
], Publisher.prototype, "hope", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Situation,
        default: Situation.Ativo,
    }),
    __metadata("design:type", String)
], Publisher.prototype, "situation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Gender,
        default: Gender.Masculino,
    }),
    __metadata("design:type", String)
], Publisher.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Publisher.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Publisher.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Publisher.prototype, "dateImmersed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Publisher.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Publisher.prototype, "startPioneer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Publisher.prototype, "privileges", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", nullable: true }),
    __metadata("design:type", Array)
], Publisher.prototype, "pioneerMonths", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
        eager: true
    }),
    (0, typeorm_1.JoinColumn)({ name: 'congregation_id' }),
    __metadata("design:type", Congregation_1.Congregation)
], Publisher.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Group_1.Group, group => group.publishers, { onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", Object)
], Publisher.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GroupOverseers_1.GroupOverseers, { nullable: true, onDelete: "SET NULL" }) // Relacionamento Many-to-One opcional com GroupOverseers
    ,
    (0, typeorm_1.JoinColumn)({ name: 'group_overseers_id' }),
    __metadata("design:type", GroupOverseers_1.GroupOverseers)
], Publisher.prototype, "groupOverseers", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => EmergencyContact_1.EmergencyContact, emergencyContact => emergencyContact.publishers, { cascade: true, eager: true }),
    (0, typeorm_1.JoinTable)({
        name: "publisher_emergency_contacts",
        joinColumn: { name: "publisher_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "emergency_contact_id", referencedColumnName: "id" }
    }),
    __metadata("design:type", Array)
], Publisher.prototype, "emergencyContacts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Publisher.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Publisher.prototype, "updated_at", void 0);
Publisher = __decorate([
    (0, typeorm_1.Entity)('publishers')
], Publisher);
exports.Publisher = Publisher;
