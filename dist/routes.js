"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("./config/multer");
const permissions_1 = require("./middlewares/permissions");
// Controllers
const CategoryController_1 = __importDefault(require("./controllers/CategoryController"));
const CleaningExceptionController_1 = __importDefault(require("./controllers/CleaningExceptionController"));
const CleaningGroupController_1 = __importDefault(require("./controllers/CleaningGroupController"));
const CleaningScheduleConfigController_1 = __importDefault(require("./controllers/CleaningScheduleConfigController"));
const CleaningScheduleController_1 = __importDefault(require("./controllers/CleaningScheduleController"));
const CongregationController_1 = __importDefault(require("./controllers/CongregationController"));
const CronJobController_1 = __importDefault(require("./controllers/CronJobController"));
const DataProcessingAgreement_1 = __importDefault(require("./controllers/DataProcessingAgreement"));
const DocumentController_1 = __importDefault(require("./controllers/DocumentController"));
const EmergencyContactController_1 = __importDefault(require("./controllers/EmergencyContactController"));
const ExternalTalkController_1 = __importDefault(require("./controllers/ExternalTalkController"));
const FamilyController_1 = __importDefault(require("./controllers/FamilyController"));
const FieldServiceExceptionController_1 = __importDefault(require("./controllers/FieldServiceExceptionController"));
const FieldServiceScheduleController_1 = __importDefault(require("./controllers/FieldServiceScheduleController"));
const FieldServiceTemplateController_1 = __importDefault(require("./controllers/FieldServiceTemplateController"));
const FieldServiceTemplateLocationOverrideController_1 = __importDefault(require("./controllers/FieldServiceTemplateLocationOverrideController"));
const FormDataController_1 = __importDefault(require("./controllers/FormDataController"));
const GroupController_1 = __importDefault(require("./controllers/GroupController"));
const HospitalityController_1 = __importDefault(require("./controllers/HospitalityController"));
const HospitalityGroupController_1 = __importDefault(require("./controllers/HospitalityGroupController"));
const MeetingAssistanceController_1 = __importDefault(require("./controllers/MeetingAssistanceController"));
const MidweekScheduleController_1 = require("./controllers/MidweekScheduleController");
const NoticeController_1 = __importDefault(require("./controllers/NoticeController"));
const NotificationController_1 = __importDefault(require("./controllers/NotificationController"));
const PermissionController_1 = __importDefault(require("./controllers/PermissionController"));
const ProfileController_1 = __importDefault(require("./controllers/ProfileController"));
const PublicWitnessArrangementController_1 = __importDefault(require("./controllers/PublicWitnessArrangementController"));
const PublicWitnessScheduleController_1 = __importDefault(require("./controllers/PublicWitnessScheduleController"));
const PublisherControllers_1 = __importDefault(require("./controllers/PublisherControllers"));
const PublisherReminderController_1 = __importDefault(require("./controllers/PublisherReminderController"));
const PushNotificationController_1 = __importDefault(require("./controllers/PushNotificationController"));
const ReportController_1 = __importDefault(require("./controllers/ReportController"));
const RoleController_1 = __importDefault(require("./controllers/RoleController"));
const SpeakerController_1 = __importDefault(require("./controllers/SpeakerController"));
const TalkController_1 = __importDefault(require("./controllers/TalkController"));
const TermsOfUseController_1 = __importDefault(require("./controllers/TermsOfUseController"));
const TerritoryController_1 = __importDefault(require("./controllers/TerritoryController"));
const TerritoryHistoryController_1 = __importDefault(require("./controllers/TerritoryHistoryController"));
const TotalsReportsController_1 = __importDefault(require("./controllers/TotalsReportsController"));
const UserController_1 = __importDefault(require("./controllers/UserController"));
const VercelUsageController_1 = __importDefault(require("./controllers/VercelUsageController"));
const WeekendScheduleController_1 = __importDefault(require("./controllers/WeekendScheduleController"));
const gitHubCronAuth_1 = require("./middlewares/gitHubCronAuth");
const routes = (0, express_1.Router)();
const midweekController = new MidweekScheduleController_1.MidweekScheduleController();
/* =========================================================
    ROTAS PÚBLICAS (sem autenticação)
========================================================= */
// Usuário e autenticação
routes.post('/user', UserController_1.default.create);
routes.post('/login', UserController_1.default.login);
routes.post('/recover-user-information', UserController_1.default.recoverUserInformation);
routes.get('/recover-user-information', UserController_1.default.recoverUserInformation);
routes.post('/forgot_password', UserController_1.default.forgot_password);
routes.post('/reset_password', UserController_1.default.reset_password);
// Congregações (dados públicos)
routes.get('/congregation/:number', CongregationController_1.default.getCongregation);
// Programação de hospitalidade (dados públicos)
routes.get('/congregation/:congregation_id/hospitality/weekends', HospitalityController_1.default.getWeekends);
// Publicadores (dados públicos)
routes.get('/publishers/congregationNumber/:congregationNumber', PublisherControllers_1.default.getPublishersWithCongregatioNumber);
// Anúncios (dados públicos)
routes.get('/notices/:congregation_id', NoticeController_1.default.getNotices);
// Serviço de campo (dados públicos)
routes.get("/field-service/schedules/futures/congregation/:congregation_id", FieldServiceScheduleController_1.default.getAllFutureSchedules);
// Testemunho público (dados públicos)
routes.get("/publicWitness/schedules/futures/congregation/:congregation_id", PublicWitnessScheduleController_1.default.getPublicWitnessScheduleByCongregation);
// Categorias (dados públicos)
routes.get('/categories', CategoryController_1.default.getCategories);
routes.get('/category/:category_id', CategoryController_1.default.getPermission);
// Discurso de fim de semana (público)
routes.get('/congregation/:congregation_id/weekendSchedules/public', WeekendScheduleController_1.default.getPublicSchedules);
// Reunião de meio de semana (público)
routes.get('/congregation/:congregation_id/midweekSchedules/public', midweekController.getPublicSchedules.bind(midweekController));
// Consentimentos (público)
routes.post("/consent/accept", DataProcessingAgreement_1.default.accept);
routes.get("/consent", DataProcessingAgreement_1.default.list);
routes.get("/consent/publisher/:publisher_id", DataProcessingAgreement_1.default.getByPublisher);
routes.get("/consent/check", DataProcessingAgreement_1.default.check);
// Termos de uso (público)
routes.get("/terms/active/:type", TermsOfUseController_1.default.getActive);
// Web Push (chave pública)
routes.get('/push/public-key', PushNotificationController_1.default.getPublicKey);
/* =========================================================
   🔒 ROTAS PRIVADAS (com autenticação e permissões)
========================================================= */
/* === Usuários === */
routes.post('/add-domain', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), UserController_1.default.addUserDomain);
routes.put('/user/roles', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), UserController_1.default.updateRoles);
routes.get('/users', (0, permissions_1.is)(['ADMIN']), UserController_1.default.getUsers);
routes.get('/users/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), UserController_1.default.getUsersByCongregation);
routes.patch('/users/:user_id/link-publisher', (0, permissions_1.is)(['ADMIN_CONGREGATION']), UserController_1.default.linkPublisherToUser);
/* === Publicadores === */
routes.get('/publishers/congregationId/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), PublisherControllers_1.default.getPublishers);
routes.get('/publisher/:publisher_id/assignment', PublisherControllers_1.default.getAssignmentPublisher);
routes.get('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.getPublisher);
routes.post('/publisher', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.create);
routes.delete('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.delete);
routes.put('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.update);
routes.patch('/publisher/:publisher_id/unlink-publisher', (0, permissions_1.is)(['ADMIN_CONGREGATION']), PublisherControllers_1.default.unlinkPublisherFromUser);
routes.put('/publishers/transfer-congregation', (0, permissions_1.is)(['ADMIN_CONGREGATION']), PublisherControllers_1.default.transferPublishers);
/* === Lembretes pessoais === */
routes.post("/reminders/publishers/:publisher_id", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.create);
routes.post("/reminders/:reminder_id/complete", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.complete);
routes.patch("/reminders/:reminder_id", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.update);
routes.delete("/reminders/:reminder_id", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.delete);
routes.get("/reminders/:reminder_id", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.getOne);
routes.get("/reminders/publishers/:publisher_id", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.getActive);
routes.get("/reminders/publishers/:publisher_id/all", (0, permissions_1.requirePublisher)(), PublisherReminderController_1.default.getAll);
/* === Notificações Push === */
routes.post("/push/subscribe", PushNotificationController_1.default.subscribe);
routes.post("/push/unsubscribe", PushNotificationController_1.default.unsubscribe);
routes.get("/push/status", PushNotificationController_1.default.getStatus);
routes.post("/push/test", PushNotificationController_1.default.testNotification);
/* === Histórico de Notificações === */
routes.get("/notifications", NotificationController_1.default.list);
routes.get("/notifications/unread-count", NotificationController_1.default.getUnreadCount);
routes.patch("/notifications/read-all", NotificationController_1.default.markAllAsRead);
routes.patch("/notifications/:notification_id/read", NotificationController_1.default.markAsRead);
/* === Contatos de emergência === */
routes.get('/emergencyContacts/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), EmergencyContactController_1.default.listByCongregation);
routes.get('/emergencyContact/:emergencyContact_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), EmergencyContactController_1.default.getEmergencyContact);
routes.post('/emergencyContact', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController_1.default.create);
routes.put('/emergencyContact/:emergencyContact_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController_1.default.update);
routes.delete('/emergencyContact/:emergencyContact_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController_1.default.delete);
/* === Congregações === */
routes.post('/congregation', (0, permissions_1.is)(['ADMIN']), multer_1.uploadFile.single('image'), CongregationController_1.default.create);
routes.delete('/congregation/:id', (0, permissions_1.is)(['ADMIN']), CongregationController_1.default.delete);
routes.get('/congregations', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController_1.default.list);
routes.get('/congregations/toTransfer', (0, permissions_1.is)(['ADMIN_CONGREGATION']), CongregationController_1.default.getCongregationSystemToTransferPublisher);
routes.put('/congregation/:congregation_id', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController_1.default.update);
routes.post('/congregation/:congregation_id/speakerCoordinator/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION']), CongregationController_1.default.addAndUpdateSpeakerCoordinator);
routes.put('/congregation/:congregation_id/photo', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), multer_1.uploadFile.single('image'), CongregationController_1.default.uploadCongregationPhoto);
/* === Congregações auxiliares === */
routes.get('/auxiliaryCongregations', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController_1.default.getAuxiliaryCongregations);
routes.post('/auxiliaryCongregations', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController_1.default.createAuxiliaryCongregation);
routes.patch('/auxiliaryCongregation/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController_1.default.updateAuxiliaryCongregation);
routes.delete('/auxiliaryCongregation/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController_1.default.deleteAuxiliaryCongregation);
/* === Grupos de hospitalidade === */
routes.get('/congregation/:congregation_id/hospitalityGroups', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.getHospitalityGroups);
routes.get('/hospitalityGroup/:hospitalityGroup_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.getHospitalityGroup);
routes.post('/congregation/:congregation_id/hospitalityGroup', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.create);
routes.patch('/hospitalityGroup/:hospitalityGroup_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.update);
routes.patch('/congregation/:congregation_id/groups/reorder', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.reorderGroups);
routes.delete('/hospitalityGroup/:hospitalityGroup_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController_1.default.delete);
/* === Categorias === */
routes.post('/category', (0, permissions_1.is)(['ADMIN']), CategoryController_1.default.create);
routes.put('/category/:category_id', (0, permissions_1.is)(['ADMIN']), CategoryController_1.default.update);
/* === Limpeza configurações === */
routes.post("/cleaning/schedule-config/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController_1.default.create);
routes.get("/cleaning/schedule-config/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController_1.default.getByCongregation);
routes.patch("/cleaning/schedule-config/:config_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController_1.default.update);
routes.get("/cleaning/schedule-config/:config_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController_1.default.getOne);
routes.delete("/cleaning/schedule-config/:config_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController_1.default.delete);
/* === Grupos de Limpeza === */
routes.post("/cleaning/groups/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController_1.default.create);
routes.get("/cleaning/groups/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController_1.default.getGroups);
routes.get("/cleaning/groups/:group_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController_1.default.getGroup);
routes.patch("/cleaning/groups/:group_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController_1.default.update);
routes.delete("/cleaning/groups/:groupId", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController_1.default.delete);
/* === Exceções de Limpeza === */
routes.post("/cleaning-exception/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController_1.default.create);
routes.get("/cleaning-exception/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController_1.default.getByCongregation);
routes.get("/cleaning-exception/:group_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController_1.default.getOne);
routes.patch("/cleaning-exception/:group_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController_1.default.update);
routes.delete("/cleaning-exception/:groupId", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController_1.default.delete);
/* === Gerar programação de limpeza === */
routes.post("/cleaning/generate-schedule/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleController_1.default.generate);
routes.get("/cleaning/schedule/congregation/:congregation_id", CleaningScheduleController_1.default.getFutureSchedules);
/* === Famílias === */
routes.post("/families/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController_1.default.create);
routes.get("/families/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController_1.default.getFamilies);
routes.get("/families/:family_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController_1.default.getFamily);
routes.patch("/families/:family_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController_1.default.update);
routes.delete("/families/:family_id", (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController_1.default.delete);
/* === Documentos === */
routes.post('/new-document', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), multer_1.uploadFile.single('file'), DocumentController_1.default.create);
routes.get('/documents-congregation/:congregation_id', DocumentController_1.default.filter);
routes.delete('/document/:document_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), DocumentController_1.default.delete);
/* === Perfis === */
routes.post('/profile/:user_id', multer_1.uploadFile.single('avatar'), ProfileController_1.default.create);
routes.put('/profile/:profile_id', multer_1.uploadFile.single('avatar'), ProfileController_1.default.update);
routes.delete('/profile/:id', ProfileController_1.default.delete);
/* === Territórios === */
routes.get('/territories/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']), TerritoryController_1.default.getTerritories);
routes.get('/territory/:territory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']), TerritoryController_1.default.getTerritory);
routes.post('/territory/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), multer_1.uploadFile.single('territory_image'), TerritoryController_1.default.create);
routes.put('/territory/:territory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), multer_1.uploadFile.single('territory_image'), TerritoryController_1.default.update);
routes.delete('/territory/:territory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryController_1.default.delete);
/* === Histórico de territórios === */
routes.get('/territoriesHistory/:congregation_id', TerritoryHistoryController_1.default.getTerritoriesHistory);
routes.get('/territoryHistory/:territory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController_1.default.getTerritoryHistory);
routes.post('/territoryHistory/:territory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController_1.default.create);
routes.put('/territoryHistory/:territoryHistory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController_1.default.update);
routes.delete('/territoryHistory/:territoryHistory_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController_1.default.delete);
/* === Funções e permissões === */
routes.post('/role', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.create);
routes.get('/roles', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), RoleController_1.default.getRoles);
routes.get('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.getRole);
routes.delete('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.delete);
routes.put('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.update);
routes.post('/permission', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.create);
routes.put('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.update);
routes.delete('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.delete);
routes.get('/permission', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.getPermissions);
routes.get('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.getPermission);
/* === Anúncios === */
routes.post('/notice/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.create);
routes.get('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.getNotice);
routes.delete('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.delete);
routes.put('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.update);
/* === Relatórios === */
routes.put('/report', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController_1.default.updatePrivilege);
routes.post('/reportManually', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController_1.default.createReportManually);
routes.delete('/report/:report_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController_1.default.deleteReport);
routes.post('/report/totals/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), TotalsReportsController_1.default.create);
routes.get('/report/totals/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), TotalsReportsController_1.default.get);
routes.post('/report', ReportController_1.default.create);
routes.get('/reports/:congregationId', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER', 'REPORTS_VIEWER']), ReportController_1.default.getReports);
routes.get('/myReports', (0, permissions_1.requirePublisher)(), ReportController_1.default.getMyReports);
/* === Grupos === */
routes.post('/group/:group_id/add-publishers', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.addPublishersGroup);
routes.delete('/group/:group_id/remove-publishers', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.removePublishersGroup);
routes.delete('/group/:group_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.delete);
routes.post('/group', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.create);
routes.get('/groups/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER', 'GROUPS_VIEWER']), GroupController_1.default.getGroups);
routes.put('/group/:group_id/change-groupOverseer', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.updateGroupOverseer);
/* === Assistência nas reuniões === */
routes.post('/assistance/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER']), MeetingAssistanceController_1.default.create);
routes.get('/assistance/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER', 'ASSISTANCE_VIEWER']), MeetingAssistanceController_1.default.getAssistance);
/* === Discursos === */
routes.post('/talk', (0, permissions_1.is)(['ADMIN']), TalkController_1.default.create);
routes.post('/talks', (0, permissions_1.is)(['ADMIN']), TalkController_1.default.importFromData);
routes.patch('/talk/:talk_id', (0, permissions_1.is)(['ADMIN']), TalkController_1.default.update);
routes.delete('/talk/:talk_id', (0, permissions_1.is)(['ADMIN']), TalkController_1.default.delete);
routes.get('/talk/:talk_id', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION', 'TALK_MANAGER']), TalkController_1.default.getTalk);
routes.get('/talks', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION', 'TALK_MANAGER']), TalkController_1.default.getTalks);
/* === Programação de fim de semana === */
routes.get('/congregation/:congregation_id/weekendSchedules', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController_1.default.getSchedules);
routes.get('/weekendSchedule/:weekendSchedule_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController_1.default.getSchedule);
routes.post('/congregation/:congregation_id/weekendSchedule', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController_1.default.create);
routes.patch('/weekendSchedule', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController_1.default.update);
routes.delete('/weekendSchedule/:weekendSchedule_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController_1.default.delete);
/* === Hospitalidade === */
routes.post("/congregation/:congregation_id/hospitality/weekends", (0, permissions_1.is)(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController_1.default.createOrUpdateBatch);
routes.patch("/assignment/:assignment_id/status", (0, permissions_1.is)(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController_1.default.updateAssignmentStatus);
routes.delete("/assignment/:assignment_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController_1.default.deleteAssignment);
routes.delete("/weekend/:weekend_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController_1.default.deleteWeekend);
/* === Discursos externos === */
routes.post('/congregation/:congregation_id/externalTalks', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.create);
routes.get('/congregation/:congregation_id/externalTalks/', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.getExternalTalks);
routes.get('/congregation/:congregation_id/externalTalks/period', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.getExternalTalksByPeriod);
routes.patch('/externalTalk/:externalTalk_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.update);
routes.patch('/externalTalk/:externalTalk_id/status', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.updateStatus);
routes.delete('/externalTalk/:externalTalk_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController_1.default.delete);
/* === Oradores === */
routes.get('/speakers', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.getSpeakers);
routes.get('/my-congregation/speakers', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.getPublishersSpeaker);
routes.get('/speaker/:speaker_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.getSpeaker);
routes.post('/speaker', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.create);
routes.patch('/speaker/:speaker_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.update);
routes.delete('/speaker/:speaker_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController_1.default.delete);
/* === Field Service Templates === */
routes.post("/field-service/templates/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController_1.default.create);
routes.get("/field-service/templates/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController_1.default.getByCongregation);
routes.get("/field-service/templates/:template_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController_1.default.getOne);
routes.patch("/field-service/templates/:template_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController_1.default.update);
routes.delete("/field-service/templates/:template_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController_1.default.delete);
routes.post("/field-service/templates/:template_id/location-overrides", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateLocationOverrideController_1.default.upsert);
/* === Field Service Schedules === */
routes.post("/field-service/templates/:template_id/schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.create);
routes.post("/field-service/templates/:template_id/generate-schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.generateByPeriod);
routes.get("/field-service/templates/:template_id/schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.getByTemplate);
routes.get("/field-service/schedules/pdf/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.pdf);
routes.get("/field-service/schedules/:schedule_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.getOne);
routes.patch("/field-service/schedules/:schedule_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.update);
routes.delete("/field-service/schedules/:schedule_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController_1.default.delete);
/* === Field Service Exceptions === */
routes.post("/field-service/exceptions/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController_1.default.create);
routes.get("/field-service/exceptions/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController_1.default.getByCongregation);
routes.get("/field-service/exceptions/:exception_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController_1.default.getOne);
routes.patch("/field-service/exceptions/:exception_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController_1.default.update);
routes.delete("/field-service/exceptions/:exception_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController_1.default.delete);
/* === Public Witness Arrangements === */
routes.post("/public-witness/arrangements/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.create);
routes.get("/public-witness/arrangements/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.getByCongregation);
routes.get("/public-witness/arrangements/:arrangement_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.getOne);
routes.patch("/public-witness/arrangements/:arrangement_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.update);
routes.patch("/public-witness/arrangements/:arrangement_id/slot-preferences", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.updateSlotPreferences);
routes.delete("/public-witness/arrangements/:arrangement_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController_1.default.delete);
/* === Public Witness Schedules === */
routes.post("/public-witness/arrangements/:arrangement_id/schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController_1.default.createMultiple);
routes.post("/public-witness/arrangements/:arrangement_id/generate-schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController_1.default.generate);
routes.get("/public-witness/arrangements/:arrangement_id/schedules", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController_1.default.getByDateRange);
routes.get("/public-witness/schedules/pdf/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController_1.default.getPdfByCongregation);
routes.get("/public-witness/schedules/congregation/:congregation_id/history", (0, permissions_1.is)(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController_1.default.getAssignmentsHistory);
/* === Termos de uso (administração) === */
routes.post("/terms", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.create);
routes.get("/terms", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.list);
routes.delete("/terms/:term_id", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.delete);
/* === Consentimentos LGPD (administração) === */
routes.get("/consent/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION']), DataProcessingAgreement_1.default.getByCongregation);
/* === Formulários === */
routes.get('/form-data', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'TALK_MANAGER']), FormDataController_1.default.getFormData);
/* === Cron Jobs === */
routes.get('/deleteExpiredNotices', gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.deleteExpiredNotices);
routes.delete('/cron/clean-old-territoryHistory', gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.cleanTerritoryHistory);
routes.delete('/cron/clean-old-schedules', gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.cleanOldData);
routes.delete("/cron/clean-field-service-overrides", gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.cleanOldFieldService);
routes.delete("/cron/clean-publisher-reminders", gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.cleanOldPublisherReminders);
routes.get('/cron/daily-notifications', gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.dispatchDailyNotifications);
routes.post('/cron/daily-notifications', gitHubCronAuth_1.verifyGitHubCron, CronJobController_1.default.dispatchDailyNotifications);
routes.get('/reportsCleanUp', permissions_1.verifyCronSecret, CronJobController_1.default.reportsCleanUp);
routes.get('/backup', permissions_1.verifyCronSecret, CronJobController_1.default.backup);
routes.get("/usage", (0, permissions_1.is)(["ADMIN"]), VercelUsageController_1.default.getUsage);
/* =========================================================
    REUNIÃO DE MEIO DE SEMANA (MIDWEEK SCHEDULE ASSISTANT)
========================================================= */
// Importação do XML da Apostila
routes.post("/midweek/import-xml", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), multer_1.uploadXml.single("file"), midweekController.importXml.bind(midweekController));
// Programação do Mês e Detalhes da Semana
routes.get("/midweek/schedules/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER", "VIEWER"]), midweekController.getMonthSchedules.bind(midweekController));
routes.get("/midweek/schedules/:schedule_id/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER", "VIEWER"]), midweekController.getScheduleById.bind(midweekController));
routes.patch("/midweek/schedules/:schedule_id/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.updateSchedule.bind(midweekController));
// Partes da Reunião
routes.patch("/midweek/parts/:part_id/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.updatePart.bind(midweekController));
routes.post("/midweek/schedules/:schedule_id/parts/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.createCustomPart.bind(midweekController));
routes.delete("/midweek/parts/:part_id/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.deletePart.bind(midweekController));
routes.post("/midweek/schedules/:schedule_id/rooms/:room/duplicate/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.duplicateStudentPartsForRoom.bind(midweekController));
routes.post("/midweek/schedules/:schedule_id/duplicate-room/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.duplicateStudentPartsForRoom.bind(midweekController));
// Sugestões de Publicadores (Histórico e Regras)
routes.get("/midweek/parts/:part_id/suggestions/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.getSuggestionsForPart.bind(midweekController));
routes.get("/midweek/schedules/:schedule_id/role-suggestions/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.getSuggestionsForRole.bind(midweekController));
// Atribuição Automática Inteligente
routes.post("/midweek/schedules/:schedule_id/auto-assign/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.autoAssignSchedule.bind(midweekController));
routes.post("/midweek/schedules/month-auto-assign/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.autoAssignMonth.bind(midweekController));
// Qualificações de Publicadores
routes.get("/midweek/publishers/:publisher_id/qualification", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.getPublisherQualification.bind(midweekController));
routes.patch("/midweek/publishers/:publisher_id/qualification", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.updatePublisherQualification.bind(midweekController));
routes.put("/midweek/publishers/:publisher_id/qualification", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER"]), midweekController.updatePublisherQualification.bind(midweekController));
// Ausências e Indisponibilidades
routes.get("/midweek/unavailabilities/congregation/:congregation_id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER", "PUBLISHERS_MANAGER", "PUBLIC_WITNESS_MANAGER", "FIELD_SERVICE_MANAGER"]), midweekController.getUnavailabilities.bind(midweekController));
routes.post("/midweek/unavailabilities", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER", "PUBLISHERS_MANAGER", "PUBLIC_WITNESS_MANAGER", "FIELD_SERVICE_MANAGER"]), midweekController.createUnavailability.bind(midweekController));
routes.delete("/midweek/unavailabilities/:id", (0, permissions_1.is)(["ADMIN", "ADMIN_CONGREGATION", "MIDWEEK_MANAGER", "PUBLISHERS_MANAGER", "PUBLIC_WITNESS_MANAGER", "FIELD_SERVICE_MANAGER"]), midweekController.deleteUnavailability.bind(midweekController));
exports.default = routes;
