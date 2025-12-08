"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("./config/multer");
const permissions_1 = require("./middlewares/permissions");
// Controllers
const UserController_1 = __importDefault(require("./controllers/UserController"));
const PublisherControllers_1 = __importDefault(require("./controllers/PublisherControllers"));
const EmergencyContactController_1 = __importDefault(require("./controllers/EmergencyContactController"));
const CongregationController_1 = __importDefault(require("./controllers/CongregationController"));
const HospitalityGroupController_1 = __importDefault(require("./controllers/HospitalityGroupController"));
const CategoryController_1 = __importDefault(require("./controllers/CategoryController"));
const DocumentController_1 = __importDefault(require("./controllers/DocumentController"));
const ProfileController_1 = __importDefault(require("./controllers/ProfileController"));
const TerritoryController_1 = __importDefault(require("./controllers/TerritoryController"));
const TerritoryHistoryController_1 = __importDefault(require("./controllers/TerritoryHistoryController"));
const RoleController_1 = __importDefault(require("./controllers/RoleController"));
const PermissionController_1 = __importDefault(require("./controllers/PermissionController"));
const NoticeController_1 = __importDefault(require("./controllers/NoticeController"));
const ReportController_1 = __importDefault(require("./controllers/ReportController"));
const TotalsReportsController_1 = __importDefault(require("./controllers/TotalsReportsController"));
const GroupController_1 = __importDefault(require("./controllers/GroupController"));
const MeetingAssistanceController_1 = __importDefault(require("./controllers/MeetingAssistanceController"));
const TalkController_1 = __importDefault(require("./controllers/TalkController"));
const WeekendScheduleController_1 = __importDefault(require("./controllers/WeekendScheduleController"));
const HospitalityController_1 = __importDefault(require("./controllers/HospitalityController"));
const ExternalTalkController_1 = __importDefault(require("./controllers/ExternalTalkController"));
const SpeakerController_1 = __importDefault(require("./controllers/SpeakerController"));
const TermsOfUseController_1 = __importDefault(require("./controllers/TermsOfUseController"));
const DataProcessingAgreement_1 = __importDefault(require("./controllers/DataProcessingAgreement"));
const FormDataController_1 = __importDefault(require("./controllers/FormDataController"));
const CronJobController_1 = __importDefault(require("./controllers/CronJobController"));
const VercelUsageController_1 = __importDefault(require("./controllers/VercelUsageController"));
const CleaningScheduleConfigController_1 = __importDefault(require("./controllers/CleaningScheduleConfigController"));
const CleaningGroupController_1 = __importDefault(require("./controllers/CleaningGroupController"));
const CleaningExceptionController_1 = __importDefault(require("./controllers/CleaningExceptionController"));
const CleaningScheduleController_1 = __importDefault(require("./controllers/CleaningScheduleController"));
const FamilyController_1 = __importDefault(require("./controllers/FamilyController"));
const routes = (0, express_1.Router)();
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
// Categorias (dados públicos)
routes.get('/categories', CategoryController_1.default.getCategories);
routes.get('/category/:category_id', CategoryController_1.default.getPermission);
// Discurso de fim de semana (público)
routes.get('/congregation/:congregation_id/weekendSchedules/public', WeekendScheduleController_1.default.getPublicSchedules);
// Consentimentos (público)
routes.post("/consent/accept", DataProcessingAgreement_1.default.accept);
routes.get("/consent", DataProcessingAgreement_1.default.list);
routes.get("/consent/publisher/:publisher_id", DataProcessingAgreement_1.default.getByPublisher);
routes.get("/consent/check", DataProcessingAgreement_1.default.check);
// Termos de uso (público)
routes.get("/terms/active/:type", TermsOfUseController_1.default.getActive);
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
routes.get('/myReports', ReportController_1.default.getMyReports);
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
/* === Termos de uso (administração) === */
routes.post("/terms", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.create);
routes.get("/terms", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.list);
routes.delete("/terms/:term_id", (0, permissions_1.is)(['ADMIN']), TermsOfUseController_1.default.delete);
/* === Consentimentos LGPD (administração) === */
routes.get("/consent/congregation/:congregation_id", (0, permissions_1.is)(['ADMIN_CONGREGATION']), DataProcessingAgreement_1.default.getByCongregation);
/* === Formulários === */
routes.get('/form-data', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'TALK_MANAGER']), FormDataController_1.default.getFormData);
/* === Cron Jobs === */
routes.get('/deleteExpiredNotices', permissions_1.verifyCronSecret, CronJobController_1.default.deleteExpiredNotices);
routes.get('/reportsCleanUp', permissions_1.verifyCronSecret, CronJobController_1.default.reportsCleanUp);
routes.get('/backup', permissions_1.verifyCronSecret, CronJobController_1.default.backup);
routes.get("/usage", (0, permissions_1.is)(["ADMIN"]), VercelUsageController_1.default.getUsage);
exports.default = routes;
