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
var Congregation_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Congregation = exports.CongregationType = void 0;
const typeorm_1 = require("typeorm");
const Document_1 = require("./Document");
const Notice_1 = require("./Notice");
const User_1 = require("./User");
const enumWeekDays_1 = require("../types/enumWeekDays");
const Group_1 = require("./Group");
const Territory_1 = require("./Territory");
const EmergencyContact_1 = require("./EmergencyContact");
const HospitalityWeekend_1 = require("./HospitalityWeekend");
const Publisher_1 = require("./Publisher");
var CongregationType;
(function (CongregationType) {
    CongregationType["SYSTEM"] = "system";
    CongregationType["AUXILIARY"] = "auxiliary"; // congregações criadas para outro objetivo
})(CongregationType = exports.CongregationType || (exports.CongregationType = {}));
let Congregation = Congregation_1 = class Congregation {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Congregation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Congregation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], Congregation.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Congregation.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Congregation.prototype, "circuit", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Congregation.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Congregation.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "speaker_coordinator_id" }),
    __metadata("design:type", Object)
], Congregation.prototype, "speakerCoordinator", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: CongregationType,
    }),
    __metadata("design:type", String)
], Congregation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enumWeekDays_1.MidweekDays, nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "dayMeetingLifeAndMinistary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time", nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "hourMeetingLifeAndMinistary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enumWeekDays_1.EndweekDays, nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "dayMeetingPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time", nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "hourMeetingPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Congregation.prototype, "imageKey", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Congregation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date
    /**
  * creatorCongregation:
  * - null para congregações SYSTEM (criadas pelo superAdmin)
  * - aponta para a congregação SYSTEM que criou, no caso das AUXILIARY
  */
    )
], Congregation.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "creator_congregation_id" }),
    __metadata("design:type", Object)
], Congregation.prototype, "creatorCongregation", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, user => user.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Document_1.Document, document => document.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Territory_1.Territory, document => document.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "territories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Notice_1.Notice, notice => notice.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "notices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Group_1.Group, group => group.groupOverseers, { nullable: true }) // Relacionamento One-to-Many com Group (opcional)
    ,
    __metadata("design:type", Array)
], Congregation.prototype, "groups", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EmergencyContact_1.EmergencyContact, (emergencyContact) => emergencyContact.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "emergencyContacts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => HospitalityWeekend_1.HospitalityWeekend, weekend => weekend.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "hospitalityWeekends", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Congregation.prototype, "has_active_consent", void 0);
Congregation = Congregation_1 = __decorate([
    (0, typeorm_1.Entity)('congregation')
], Congregation);
exports.Congregation = Congregation;
