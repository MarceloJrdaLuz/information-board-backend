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
exports.MidweekWorkbookPart = exports.MidweekSection = exports.MidweekPartType = void 0;
const typeorm_1 = require("typeorm");
const MidweekWorkbookWeek_1 = require("./MidweekWorkbookWeek");
const midweekEnums_1 = require("./midweekEnums");
var midweekEnums_2 = require("./midweekEnums");
Object.defineProperty(exports, "MidweekPartType", { enumerable: true, get: function () { return midweekEnums_2.MidweekPartType; } });
Object.defineProperty(exports, "MidweekSection", { enumerable: true, get: function () { return midweekEnums_2.MidweekSection; } });
let MidweekWorkbookPart = class MidweekWorkbookPart {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MidweekWorkbookPart.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MidweekWorkbookWeek_1.MidweekWorkbookWeek, week => week.parts, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: "workbook_week_id" }),
    __metadata("design:type", MidweekWorkbookWeek_1.MidweekWorkbookWeek)
], MidweekWorkbookPart.prototype, "workbookWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MidweekWorkbookPart.prototype, "workbook_week_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekSection,
        default: midweekEnums_1.MidweekSection.MINISTRY
    }),
    __metadata("design:type", String)
], MidweekWorkbookPart.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: midweekEnums_1.MidweekPartType,
        default: midweekEnums_1.MidweekPartType.INITIAL_CALL
    }),
    __metadata("design:type", String)
], MidweekWorkbookPart.prototype, "partType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], MidweekWorkbookPart.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "sourceMaterial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 3 }),
    __metadata("design:type", Number)
], MidweekWorkbookPart.prototype, "timeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "lessonNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "studyPoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "studyPointDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "brochure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MidweekWorkbookPart.prototype, "requiresAssistant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookPart.prototype, "prompts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], MidweekWorkbookPart.prototype, "orderIndex", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MidweekWorkbookPart.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MidweekWorkbookPart.prototype, "updated_at", void 0);
MidweekWorkbookPart = __decorate([
    (0, typeorm_1.Entity)("midweek_workbook_parts")
], MidweekWorkbookPart);
exports.MidweekWorkbookPart = MidweekWorkbookPart;
