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
exports.MechanicalAssignment = void 0;
const typeorm_1 = require("typeorm");
const mechanical_1 = require("../types/mechanical");
const MechanicalSchedule_1 = require("./MechanicalSchedule");
const Publisher_1 = require("./Publisher");
let MechanicalAssignment = class MechanicalAssignment {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MechanicalAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MechanicalSchedule_1.MechanicalSchedule, schedule => schedule.assignments, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: "schedule_id" }),
    __metadata("design:type", MechanicalSchedule_1.MechanicalSchedule)
], MechanicalAssignment.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MechanicalAssignment.prototype, "schedule_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: mechanical_1.MechanicalRole
    }),
    __metadata("design:type", String)
], MechanicalAssignment.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], MechanicalAssignment.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Object)
], MechanicalAssignment.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], MechanicalAssignment.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MechanicalAssignment.prototype, "isManual", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MechanicalAssignment.prototype, "updated_at", void 0);
MechanicalAssignment = __decorate([
    (0, typeorm_1.Entity)("mechanical_assignments")
], MechanicalAssignment);
exports.MechanicalAssignment = MechanicalAssignment;
