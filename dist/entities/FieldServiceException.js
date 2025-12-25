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
exports.FieldServiceException = void 0;
const typeorm_1 = require("typeorm");
const FieldServiceTemplate_1 = require("./FieldServiceTemplate");
const Congregation_1 = require("./Congregation");
let FieldServiceException = class FieldServiceException {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], FieldServiceException.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], FieldServiceException.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], FieldServiceException.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], FieldServiceException.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FieldServiceTemplate_1.FieldServiceTemplate, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "template_id" }),
    __metadata("design:type", FieldServiceTemplate_1.FieldServiceTemplate)
], FieldServiceException.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], FieldServiceException.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FieldServiceException.prototype, "reason", void 0);
FieldServiceException = __decorate([
    (0, typeorm_1.Entity)("field_service_exceptions"),
    (0, typeorm_1.Index)(["date"]),
    (0, typeorm_1.Index)(["congregation_id", "date"]),
    (0, typeorm_1.Index)(["template_id", "date"])
], FieldServiceException);
exports.FieldServiceException = FieldServiceException;
