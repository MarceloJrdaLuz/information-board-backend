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
exports.WeekendSchedule = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const HospitalityGroup_1 = require("./HospitalityGroup.");
const Publisher_1 = require("./Publisher");
const Speaker_1 = require("./Speaker");
const Talk_1 = require("./Talk");
let WeekendSchedule = class WeekendSchedule {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], WeekendSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], WeekendSchedule.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "chairman_id" }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "chairman", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "reader_id" }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "reader", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Speaker_1.Speaker, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "speaker_id" }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "speaker", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Talk_1.Talk, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "talk_id" }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "talk", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "watchTowerStudyTitle", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HospitalityGroup_1.HospitalityGroup, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "hospitality_group_id" }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "hospitalityGroup", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], WeekendSchedule.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], WeekendSchedule.prototype, "isSpecial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "specialName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "manualSpeaker", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], WeekendSchedule.prototype, "manualTalk", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WeekendSchedule.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WeekendSchedule.prototype, "updated_at", void 0);
WeekendSchedule = __decorate([
    (0, typeorm_1.Entity)("weekend_schedules")
], WeekendSchedule);
exports.WeekendSchedule = WeekendSchedule;
