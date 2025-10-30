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
exports.DataProcessingAgreement = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const User_1 = require("./User");
const TermsOfUse_1 = require("./TermsOfUse");
const Publisher_1 = require("./Publisher");
let DataProcessingAgreement = class DataProcessingAgreement {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DataProcessingAgreement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], DataProcessingAgreement.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], DataProcessingAgreement.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], DataProcessingAgreement.prototype, "content_snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 128, nullable: true }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "content_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    __metadata("design:type", Date)
], DataProcessingAgreement.prototype, "accepted_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "accepted_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "accepted_by_user_id" }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "accepted_by_user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TermsOfUse_1.TermsOfUse, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "terms_id" }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "terms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], DataProcessingAgreement.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DataProcessingAgreement.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DataProcessingAgreement.prototype, "updated_at", void 0);
DataProcessingAgreement = __decorate([
    (0, typeorm_1.Entity)("data_processing_agreements")
], DataProcessingAgreement);
exports.DataProcessingAgreement = DataProcessingAgreement;
