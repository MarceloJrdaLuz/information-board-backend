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
exports.MidweekMeetingPart = exports.MidweekRoom = void 0;
const typeorm_1 = require("typeorm");
const midweekEnums_1 = require("./midweekEnums");
const MidweekSchedule_1 = require("./MidweekSchedule");
const MidweekWorkbookPart_1 = require("./MidweekWorkbookPart");
const Publisher_1 = require("./Publisher");
var midweekEnums_2 = require("./midweekEnums");
Object.defineProperty(exports, "MidweekRoom", { enumerable: true, get: function () { return midweekEnums_2.MidweekRoom; } });
let MidweekMeetingPart = class MidweekMeetingPart {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MidweekSchedule_1.MidweekSchedule, schedule => schedule.parts, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: "schedule_id" }),
    __metadata("design:type", MidweekSchedule_1.MidweekSchedule)
], MidweekMeetingPart.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "schedule_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MidweekWorkbookPart_1.MidweekWorkbookPart, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "workbook_part_id" }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "workbookPart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "workbook_part_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekSection,
        default: midweekEnums_1.MidweekSection.MINISTRY
    }),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekPartType,
        default: midweekEnums_1.MidweekPartType.INITIAL_CALL
    }),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "partType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "sourceMaterial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 3 }),
    __metadata("design:type", Number)
], MidweekMeetingPart.prototype, "timeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "lessonNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "studyPoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "studyPointDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "brochure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MidweekMeetingPart.prototype, "requiresAssistant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekRoom,
        default: midweekEnums_1.MidweekRoom.MAIN
    }),
    __metadata("design:type", String)
], MidweekMeetingPart.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_publisher_id" }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "assignedPublisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "assigned_publisher_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "assistant_publisher_id" }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "assistantPublisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "assistant_publisher_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "custom_speaker_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], MidweekMeetingPart.prototype, "orderIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], MidweekMeetingPart.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MidweekMeetingPart.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], MidweekMeetingPart.prototype, "prompts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MidweekMeetingPart.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MidweekMeetingPart.prototype, "updated_at", void 0);
MidweekMeetingPart = __decorate([
    (0, typeorm_1.Entity)("midweek_meeting_parts")
], MidweekMeetingPart);
exports.MidweekMeetingPart = MidweekMeetingPart;
