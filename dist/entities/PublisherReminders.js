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
exports.PublisherReminder = exports.RecurrenceType = void 0;
const typeorm_1 = require("typeorm");
const Publisher_1 = require("./Publisher");
// types/RecurrenceType.ts ou dentro do arquivo da entidade
var RecurrenceType;
(function (RecurrenceType) {
    RecurrenceType["DAILY"] = "DAILY";
    RecurrenceType["WEEKLY"] = "WEEKLY";
    RecurrenceType["MONTHLY"] = "MONTHLY";
    RecurrenceType["YEARLY"] = "YEARLY";
})(RecurrenceType = exports.RecurrenceType || (exports.RecurrenceType = {}));
let PublisherReminder = class PublisherReminder {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublisherReminder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], PublisherReminder.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], PublisherReminder.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PublisherReminder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], PublisherReminder.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], PublisherReminder.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PublisherReminder.prototype, "isRecurring", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "recurrenceIntervalDays",
        type: "int",
        nullable: true
    }),
    __metadata("design:type", Object)
], PublisherReminder.prototype, "recurrenceInterval", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: RecurrenceType,
        default: RecurrenceType.DAILY
    }),
    __metadata("design:type", String)
], PublisherReminder.prototype, "recurrenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], PublisherReminder.prototype, "recurrenceCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PublisherReminder.prototype, "recurrenceExecutedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], PublisherReminder.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PublisherReminder.prototype, "completed_until", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PublisherReminder.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PublisherReminder.prototype, "updated_at", void 0);
PublisherReminder = __decorate([
    (0, typeorm_1.Entity)("publisher_reminders")
], PublisherReminder);
exports.PublisherReminder = PublisherReminder;
