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
exports.Speaker = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const Publisher_1 = require("./Publisher");
const Talk_1 = require("./Talk");
let Speaker = class Speaker {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Speaker.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Speaker.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Speaker.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Speaker.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "creator_congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], Speaker.prototype, "creatorCongregation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "origin_congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], Speaker.prototype, "originCongregation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Object)
], Speaker.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Talk_1.Talk, talk => talk.speakers),
    (0, typeorm_1.JoinTable)({
        name: "speakers_talks",
        joinColumn: { name: "speaker_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "talk_id", referencedColumnName: "id" }
    }),
    __metadata("design:type", Array)
], Speaker.prototype, "talks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Speaker.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Speaker.prototype, "updated_at", void 0);
Speaker = __decorate([
    (0, typeorm_1.Entity)("speakers"),
    (0, typeorm_1.Index)("uq_speaker_name_publisher_creator", ["fullName", "publisher", "creatorCongregation"], { unique: true })
], Speaker);
exports.Speaker = Speaker;
