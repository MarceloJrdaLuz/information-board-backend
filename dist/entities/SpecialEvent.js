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
exports.SpecialEvent = exports.EventImpactScope = exports.SpecialEventType = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
var SpecialEventType;
(function (SpecialEventType) {
    SpecialEventType["CIRCUIT_ASSEMBLY"] = "CIRCUIT_ASSEMBLY";
    SpecialEventType["REGIONAL_CONVENTION"] = "REGIONAL_CONVENTION";
    SpecialEventType["MEMORIAL"] = "MEMORIAL";
    SpecialEventType["CIRCUIT_OVERSEER_VISIT"] = "CIRCUIT_OVERSEER_VISIT";
    SpecialEventType["SPECIAL_TALK"] = "SPECIAL_TALK";
    SpecialEventType["CUSTOM"] = "CUSTOM";
})(SpecialEventType = exports.SpecialEventType || (exports.SpecialEventType = {}));
var EventImpactScope;
(function (EventImpactScope) {
    EventImpactScope["NONE"] = "NONE";
    EventImpactScope["EVENT_DAYS_ONLY"] = "EVENT_DAYS_ONLY";
    EventImpactScope["ALL_DAYS"] = "ALL_DAYS";
})(EventImpactScope = exports.EventImpactScope || (exports.EventImpactScope = {}));
let SpecialEvent = class SpecialEvent {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SpecialEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], SpecialEvent.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: SpecialEventType,
        default: SpecialEventType.CUSTOM
    }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "affectsWholeWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "cancelMidweekMeeting", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "cancelWeekendMeeting", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "isCircuitOverseerVisit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "cancelCleaning", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "cancelMechanical", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EventImpactScope,
        default: EventImpactScope.NONE
    }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "fieldServiceImpact", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EventImpactScope,
        default: EventImpactScope.NONE
    }),
    __metadata("design:type", String)
], SpecialEvent.prototype, "publicWitnessingImpact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], SpecialEvent.prototype, "showOnPublicBoard", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], SpecialEvent.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], SpecialEvent.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], SpecialEvent.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SpecialEvent.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SpecialEvent.prototype, "updated_at", void 0);
SpecialEvent = __decorate([
    (0, typeorm_1.Entity)("special_events")
], SpecialEvent);
exports.SpecialEvent = SpecialEvent;
