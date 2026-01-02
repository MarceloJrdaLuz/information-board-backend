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
exports.PublicWitnessArrangement = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const PublicWitnessTimeSlot_1 = require("./PublicWitnessTimeSlot");
let PublicWitnessArrangement = class PublicWitnessArrangement {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublicWitnessArrangement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublicWitnessArrangement.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], PublicWitnessArrangement.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PublicWitnessArrangement.prototype, "is_fixed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], PublicWitnessArrangement.prototype, "weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], PublicWitnessArrangement.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], PublicWitnessArrangement.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PublicWitnessTimeSlot_1.PublicWitnessTimeSlot, slot => slot.arrangement, { cascade: true }),
    __metadata("design:type", Array)
], PublicWitnessArrangement.prototype, "timeSlots", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PublicWitnessArrangement.prototype, "created_at", void 0);
PublicWitnessArrangement = __decorate([
    (0, typeorm_1.Entity)("public_witness_arrangements")
], PublicWitnessArrangement);
exports.PublicWitnessArrangement = PublicWitnessArrangement;
