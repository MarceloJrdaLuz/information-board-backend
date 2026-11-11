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
exports.ScheduleReminderConfig = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
let ScheduleReminderConfig = class ScheduleReminderConfig {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ScheduleReminderConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], ScheduleReminderConfig.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", unique: true }),
    __metadata("design:type", String)
], ScheduleReminderConfig.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 15 }),
    __metadata("design:type", Number)
], ScheduleReminderConfig.prototype, "cleaning_days_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ScheduleReminderConfig.prototype, "cleaning_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 15 }),
    __metadata("design:type", Number)
], ScheduleReminderConfig.prototype, "field_service_days_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ScheduleReminderConfig.prototype, "field_service_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 15 }),
    __metadata("design:type", Number)
], ScheduleReminderConfig.prototype, "public_witnessing_days_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ScheduleReminderConfig.prototype, "public_witnessing_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 30 }),
    __metadata("design:type", Number)
], ScheduleReminderConfig.prototype, "midweek_meeting_days_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ScheduleReminderConfig.prototype, "midweek_meeting_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 20 }),
    __metadata("design:type", Number)
], ScheduleReminderConfig.prototype, "weekend_meeting_days_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ScheduleReminderConfig.prototype, "weekend_meeting_enabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleReminderConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleReminderConfig.prototype, "updated_at", void 0);
ScheduleReminderConfig = __decorate([
    (0, typeorm_1.Entity)("schedule_reminder_configs")
], ScheduleReminderConfig);
exports.ScheduleReminderConfig = ScheduleReminderConfig;
