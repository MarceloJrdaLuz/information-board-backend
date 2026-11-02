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
exports.PublisherFieldActivity = void 0;
const typeorm_1 = require("typeorm");
const Publisher_1 = require("./Publisher");
const PublisherBibleStudent_1 = require("./PublisherBibleStudent");
let PublisherFieldActivity = class PublisherFieldActivity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PublisherFieldActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], PublisherFieldActivity.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PublisherFieldActivity.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], PublisherFieldActivity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PublisherFieldActivity.prototype, "minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PublisherFieldActivity.prototype, "credit_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PublisherFieldActivity.prototype, "credit_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PublisherFieldActivity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PublisherBibleStudent_1.PublisherBibleStudent, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "bible_student_id" }),
    __metadata("design:type", Object)
], PublisherFieldActivity.prototype, "bibleStudent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], PublisherFieldActivity.prototype, "bible_student_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", nullable: true }),
    __metadata("design:type", Object)
], PublisherFieldActivity.prototype, "bible_student_ids", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PublisherFieldActivity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PublisherFieldActivity.prototype, "updated_at", void 0);
PublisherFieldActivity = __decorate([
    (0, typeorm_1.Entity)("publisher_field_activities")
], PublisherFieldActivity);
exports.PublisherFieldActivity = PublisherFieldActivity;
