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
exports.ExternalTalk = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const Speaker_1 = require("./Speaker");
const Talk_1 = require("./Talk");
let ExternalTalk = class ExternalTalk {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExternalTalk.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], ExternalTalk.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Speaker_1.Speaker, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "speaker_id" }),
    __metadata("design:type", Speaker_1.Speaker)
], ExternalTalk.prototype, "speaker", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Talk_1.Talk, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "talk_id" }),
    __metadata("design:type", Object)
], ExternalTalk.prototype, "talk", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], ExternalTalk.prototype, "manualTalk", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "origin_congregation_id" }) // de onde o orador sai
    ,
    __metadata("design:type", Congregation_1.Congregation)
], ExternalTalk.prototype, "originCongregation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "destination_congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], ExternalTalk.prototype, "destinationCongregation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    }),
    __metadata("design:type", String)
], ExternalTalk.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExternalTalk.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ExternalTalk.prototype, "updated_at", void 0);
ExternalTalk = __decorate([
    (0, typeorm_1.Entity)("external_talks")
], ExternalTalk);
exports.ExternalTalk = ExternalTalk;
