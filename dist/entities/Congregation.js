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
exports.Congregation = void 0;
const typeorm_1 = require("typeorm");
const Document_1 = require("./Document");
const Notice_1 = require("./Notice");
const User_1 = require("./User");
const enumWeekDays_1 = require("../types/enumWeekDays");
const Group_1 = require("./Group");
let Congregation = class Congregation {
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
    __metadata("design:type", Date)
], Congregation.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, user => user.congregation),
    (0, typeorm_1.OneToMany)(() => User_1.User, user => user.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Document_1.Document, document => document.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Notice_1.Notice, notice => notice.congregation),
    __metadata("design:type", Array)
], Congregation.prototype, "notices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Group_1.Group, group => group.groupOverseers, { nullable: true }) // Relacionamento One-to-Many com Group (opcional)
    ,
    __metadata("design:type", Array)
], Congregation.prototype, "groups", void 0);
Congregation = __decorate([
    (0, typeorm_1.Entity)('congregation')
], Congregation);
exports.Congregation = Congregation;
