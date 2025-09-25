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
exports.PublisherPrivilege = void 0;
const typeorm_1 = require("typeorm");
const Publisher_1 = require("./Publisher");
const Privilege_1 = require("./Privilege");
let PublisherPrivilege = class PublisherPrivilege {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublisherPrivilege.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, publisher => publisher.privilegesRelation, {
        onDelete: "CASCADE"
    }),
    __metadata("design:type", Publisher_1.Publisher)
], PublisherPrivilege.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Privilege_1.Privilege, { onDelete: "CASCADE" }),
    __metadata("design:type", Privilege_1.Privilege)
], PublisherPrivilege.prototype, "privilege", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], PublisherPrivilege.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], PublisherPrivilege.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PublisherPrivilege.prototype, "created_at", void 0);
PublisherPrivilege = __decorate([
    (0, typeorm_1.Entity)("publisher_privileges")
], PublisherPrivilege);
exports.PublisherPrivilege = PublisherPrivilege;
