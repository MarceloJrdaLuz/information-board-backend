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
exports.PublicWitnessAssignmentPublisher = void 0;
const typeorm_1 = require("typeorm");
const PublicWitnessAssignment_1 = require("./PublicWitnessAssignment");
const Publisher_1 = require("./Publisher");
let PublicWitnessAssignmentPublisher = class PublicWitnessAssignmentPublisher {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublicWitnessAssignmentPublisher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublicWitnessAssignmentPublisher.prototype, "assignment_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PublicWitnessAssignment_1.PublicWitnessAssignment, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "assignment_id" }),
    __metadata("design:type", PublicWitnessAssignment_1.PublicWitnessAssignment)
], PublicWitnessAssignmentPublisher.prototype, "assignment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublicWitnessAssignmentPublisher.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], PublicWitnessAssignmentPublisher.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PublicWitnessAssignmentPublisher.prototype, "order", void 0);
PublicWitnessAssignmentPublisher = __decorate([
    (0, typeorm_1.Entity)("public_witness_assignment_publishers"),
    (0, typeorm_1.Unique)(["assignment_id", "publisher_id"])
], PublicWitnessAssignmentPublisher);
exports.PublicWitnessAssignmentPublisher = PublicWitnessAssignmentPublisher;
