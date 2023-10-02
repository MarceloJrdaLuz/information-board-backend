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
exports.GroupOverseers = void 0;
const typeorm_1 = require("typeorm");
const Publisher_1 = require("./Publisher");
let GroupOverseers = class GroupOverseers {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GroupOverseers.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, publisher => publisher.groupOverseers, { eager: true, onDelete: "CASCADE" }) // Relacionamento Many-to-One com Publisher
    ,
    (0, typeorm_1.JoinColumn)({ name: 'publisher_id' }),
    __metadata("design:type", Object)
], GroupOverseers.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GroupOverseers.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GroupOverseers.prototype, "updated_at", void 0);
GroupOverseers = __decorate([
    (0, typeorm_1.Entity)('groupOverseers')
], GroupOverseers);
exports.GroupOverseers = GroupOverseers;
