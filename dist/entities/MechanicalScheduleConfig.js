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
exports.MechanicalScheduleConfig = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
let MechanicalScheduleConfig = class MechanicalScheduleConfig {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MechanicalScheduleConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], MechanicalScheduleConfig.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MechanicalScheduleConfig.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MechanicalScheduleConfig.prototype, "combineSoundAndMedia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MechanicalScheduleConfig.prototype, "sameTeamWholeWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 2 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "midweekAttendantsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "midweekSoundCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "midweekMediaCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 2 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "midweekRovingMicsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "midweekStageMicsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 2 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "weekendAttendantsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "weekendSoundCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "weekendMediaCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 2 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "weekendRovingMicsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalScheduleConfig.prototype, "weekendStageMicsCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalScheduleConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalScheduleConfig.prototype, "updated_at", void 0);
MechanicalScheduleConfig = __decorate([
    (0, typeorm_1.Entity)("mechanical_schedule_config")
], MechanicalScheduleConfig);
exports.MechanicalScheduleConfig = MechanicalScheduleConfig;
