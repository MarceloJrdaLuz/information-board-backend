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
exports.MidweekSchedule = exports.MidweekSpecialType = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const MidweekMeetingPart_1 = require("./MidweekMeetingPart");
const MidweekWorkbookWeek_1 = require("./MidweekWorkbookWeek");
const Publisher_1 = require("./Publisher");
const midweekEnums_1 = require("./midweekEnums");
var midweekEnums_2 = require("./midweekEnums");
Object.defineProperty(exports, "MidweekSpecialType", { enumerable: true, get: function () { return midweekEnums_2.MidweekSpecialType; } });
let MidweekSchedule = class MidweekSchedule {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MidweekSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], MidweekSchedule.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MidweekSchedule.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MidweekWorkbookWeek_1.MidweekWorkbookWeek, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "workbook_week_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "workbookWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "workbook_week_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], MidweekSchedule.prototype, "weekDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], MidweekSchedule.prototype, "meetingDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "weeklyBibleReading", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "watchtowerStudyTheme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "songOpen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "songMiddle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "songEnd", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "chairman_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "chairman", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "chairman_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "opening_prayer_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "openingPrayer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "opening_prayer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "closing_prayer_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "closingPrayer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "closing_prayer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "aux_counselor_1_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "auxCounselor1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "aux_counselor_1_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "aux_counselor_2_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "auxCounselor2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "aux_counselor_2_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "cbs_conductor_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "cbsConductor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "cbs_conductor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "cbs_reader_id" }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "cbsReader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "cbs_reader_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MidweekSchedule.prototype, "isSpecial", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekSpecialType,
        default: midweekEnums_1.MidweekSpecialType.NONE
    }),
    __metadata("design:type", String)
], MidweekSchedule.prototype, "specialType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "specialName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekSchedule.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MidweekMeetingPart_1.MidweekMeetingPart, part => part.schedule, {
        cascade: true
    }),
    __metadata("design:type", Array)
], MidweekSchedule.prototype, "parts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MidweekSchedule.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MidweekSchedule.prototype, "updated_at", void 0);
MidweekSchedule = __decorate([
    (0, typeorm_1.Entity)("midweek_schedules")
], MidweekSchedule);
exports.MidweekSchedule = MidweekSchedule;
