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
exports.MechanicalSchedule = void 0;
const typeorm_1 = require("typeorm");
const mechanical_1 = require("../types/mechanical");
const Congregation_1 = require("./Congregation");
const MechanicalAssignment_1 = require("./MechanicalAssignment");
let MechanicalSchedule = class MechanicalSchedule {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MechanicalSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], MechanicalSchedule.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MechanicalSchedule.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], MechanicalSchedule.prototype, "weekStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], MechanicalSchedule.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: mechanical_1.MechanicalMeetingType
    }),
    __metadata("design:type", String)
], MechanicalSchedule.prototype, "meetingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MechanicalSchedule.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MechanicalSchedule.prototype, "hasNoMeeting", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MechanicalSchedule.prototype, "eventTitle", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MechanicalAssignment_1.MechanicalAssignment, assignment => assignment.schedule, {
        cascade: true
    }),
    __metadata("design:type", Array)
], MechanicalSchedule.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalSchedule.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalSchedule.prototype, "updated_at", void 0);
MechanicalSchedule = __decorate([
    (0, typeorm_1.Entity)("mechanical_schedules")
], MechanicalSchedule);
exports.MechanicalSchedule = MechanicalSchedule;
