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
exports.PublicWitnessArrangementPublisher = void 0;
const typeorm_1 = require("typeorm");
const PublicWitnessArrangement_1 = require("./PublicWitnessArrangement");
const Publisher_1 = require("./Publisher");
let PublicWitnessArrangementPublisher = class PublicWitnessArrangementPublisher {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublicWitnessArrangementPublisher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PublicWitnessArrangementPublisher.prototype, "arrangement_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PublicWitnessArrangement_1.PublicWitnessArrangement, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "arrangement_id" }),
    __metadata("design:type", PublicWitnessArrangement_1.PublicWitnessArrangement)
], PublicWitnessArrangementPublisher.prototype, "arrangement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PublicWitnessArrangementPublisher.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], PublicWitnessArrangementPublisher.prototype, "publisher", void 0);
PublicWitnessArrangementPublisher = __decorate([
    (0, typeorm_1.Entity)("public_witness_arrangement_publishers"),
    (0, typeorm_1.Unique)(["arrangement_id", "publisher_id"])
], PublicWitnessArrangementPublisher);
exports.PublicWitnessArrangementPublisher = PublicWitnessArrangementPublisher;
