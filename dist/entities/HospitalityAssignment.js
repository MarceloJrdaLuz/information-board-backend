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
exports.HospitalityAssignment = void 0;
const typeorm_1 = require("typeorm");
const HospitalityWeekend_1 = require("./HospitalityWeekend");
const HospitalityGroup_1 = require("./HospitalityGroup.");
const hospitality_1 = require("../types/hospitality");
let HospitalityAssignment = class HospitalityAssignment {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HospitalityAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HospitalityWeekend_1.HospitalityWeekend, weekend => weekend.assignments, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "weekend_id" }),
    __metadata("design:type", HospitalityWeekend_1.HospitalityWeekend)
], HospitalityAssignment.prototype, "weekend", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: hospitality_1.HospitalityEventType }),
    __metadata("design:type", String)
], HospitalityAssignment.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HospitalityGroup_1.HospitalityGroup, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "group_id" }),
    __metadata("design:type", Object)
], HospitalityAssignment.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", nullable: true, default: null }),
    __metadata("design:type", Object)
], HospitalityAssignment.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HospitalityAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HospitalityAssignment.prototype, "updated_at", void 0);
HospitalityAssignment = __decorate([
    (0, typeorm_1.Entity)("hospitality_assignment")
], HospitalityAssignment);
exports.HospitalityAssignment = HospitalityAssignment;
