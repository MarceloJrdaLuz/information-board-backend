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
exports.PublicWitnessTimeSlotDefaultPublisher = void 0;
const typeorm_1 = require("typeorm");
const PublicWitnessTimeSlot_1 = require("./PublicWitnessTimeSlot");
const Publisher_1 = require("./Publisher");
let PublicWitnessTimeSlotDefaultPublisher = class PublicWitnessTimeSlotDefaultPublisher {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "time_slot_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PublicWitnessTimeSlot_1.PublicWitnessTimeSlot, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "time_slot_id" }),
    __metadata("design:type", PublicWitnessTimeSlot_1.PublicWitnessTimeSlot)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "timeSlot", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PublicWitnessTimeSlotDefaultPublisher.prototype, "order", void 0);
PublicWitnessTimeSlotDefaultPublisher = __decorate([
    (0, typeorm_1.Entity)("public_witness_time_slot_default_publishers")
], PublicWitnessTimeSlotDefaultPublisher);
exports.PublicWitnessTimeSlotDefaultPublisher = PublicWitnessTimeSlotDefaultPublisher;
