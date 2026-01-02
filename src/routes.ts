import { Router } from "express"
import { uploadFile } from "./config/multer"
import { is, verifyCronSecret } from "./middlewares/permissions"

// Controllers
import UserController from "./controllers/UserController"
import PublisherControllers from "./controllers/PublisherControllers"
import EmergencyContactController from "./controllers/EmergencyContactController"
import CongregationController from "./controllers/CongregationController"
import HospitalityGroupController from "./controllers/HospitalityGroupController"
import CategoryController from "./controllers/CategoryController"
import DocumentController from "./controllers/DocumentController"
import ProfileController from "./controllers/ProfileController"
import TerritoryController from "./controllers/TerritoryController"
import TerritoryHistoryController from "./controllers/TerritoryHistoryController"
import RoleController from "./controllers/RoleController"
import PermissionController from "./controllers/PermissionController"
import NoticeController from "./controllers/NoticeController"
import ReportController from "./controllers/ReportController"
import TotalsReportsController from "./controllers/TotalsReportsController"
import GroupController from "./controllers/GroupController"
import MeetingAssistanceController from "./controllers/MeetingAssistanceController"
import TalkController from "./controllers/TalkController"
import WeekendScheduleController from "./controllers/WeekendScheduleController"
import HospitalityController from "./controllers/HospitalityController"
import ExternalTalkController from "./controllers/ExternalTalkController"
import SpeakerController from "./controllers/SpeakerController"
import TermsOfUseController from "./controllers/TermsOfUseController"
import DataProcessingAgreementController from "./controllers/DataProcessingAgreement"
import FormDataController from "./controllers/FormDataController"
import CronJobController from "./controllers/CronJobController"
import VercelUsageController from "./controllers/VercelUsageController"
import CleaningScheduleConfigController from "./controllers/CleaningScheduleConfigController"
import CleaningGroupController from "./controllers/CleaningGroupController"
import CleaningExceptionController from "./controllers/CleaningExceptionController"
import CleaningScheduleController from "./controllers/CleaningScheduleController"
import FamilyController from "./controllers/FamilyController"
import { verifyGitHubCron } from "./middlewares/gitHubCronAuth"
import FieldServiceTemplateController from "./controllers/FieldServiceTemplateController"
import FieldServiceExceptionController from "./controllers/FieldServiceExceptionController"
import FieldServiceScheduleController from "./controllers/FieldServiceScheduleController"
import PublicWitnessArrangementController from "./controllers/PublicWitnessArrangementController"
import PublicWitnessScheduleController from "./controllers/PublicWitnessScheduleController"

const routes = Router()

/* =========================================================
    ROTAS PÚBLICAS (sem autenticação)
========================================================= */

// Usuário e autenticação
routes.post('/user', UserController.create)
routes.post('/login', UserController.login)
routes.post('/recover-user-information', UserController.recoverUserInformation)
routes.get('/recover-user-information', UserController.recoverUserInformation)
routes.post('/forgot_password', UserController.forgot_password)
routes.post('/reset_password', UserController.reset_password)

// Congregações (dados públicos)
routes.get('/congregation/:number', CongregationController.getCongregation)

// Programação de hospitalidade (dados públicos)
routes.get('/congregation/:congregation_id/hospitality/weekends', HospitalityController.getWeekends)

// Publicadores (dados públicos)
routes.get('/publishers/congregationNumber/:congregationNumber', PublisherControllers.getPublishersWithCongregatioNumber)

// Anúncios (dados públicos)
routes.get('/notices/:congregation_id', NoticeController.getNotices)

// Serviço de campo (dados públicos)
routes.get("/field-service/schedules/futures/congregation/:congregation_id", FieldServiceScheduleController.getAllFutureSchedules);
// Testemunho público (dados públicos)
routes.get("/publicWitness/schedules/futures/congregation/:congregation_id", PublicWitnessScheduleController.getPublicWitnessScheduleByCongregation);

// Categorias (dados públicos)
routes.get('/categories', CategoryController.getCategories)
routes.get('/category/:category_id', CategoryController.getPermission)

// Discurso de fim de semana (público)
routes.get('/congregation/:congregation_id/weekendSchedules/public', WeekendScheduleController.getPublicSchedules)

// Consentimentos (público)
routes.post("/consent/accept", DataProcessingAgreementController.accept)
routes.get("/consent", DataProcessingAgreementController.list)
routes.get("/consent/publisher/:publisher_id", DataProcessingAgreementController.getByPublisher)
routes.get("/consent/check", DataProcessingAgreementController.check)

// Termos de uso (público)
routes.get("/terms/active/:type", TermsOfUseController.getActive)

/* =========================================================
   🔒 ROTAS PRIVADAS (com autenticação e permissões)
========================================================= */

/* === Usuários === */
routes.post('/add-domain', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.addUserDomain)
routes.put('/user/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.updateRoles)
routes.get('/users', is(['ADMIN']), UserController.getUsers)
routes.get('/users/:congregation_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), UserController.getUsersByCongregation)
routes.patch('/users/:user_id/link-publisher', is(['ADMIN_CONGREGATION']), UserController.linkPublisherToUser)

/* === Publicadores === */
routes.get('/publishers/congregationId/:congregation_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), PublisherControllers.getPublishers)
routes.get('/publisher/:publisher_id/assignment', PublisherControllers.getAssignmentPublisher)
routes.get('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.getPublisher)
routes.post('/publisher', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.create)
routes.delete('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.delete)
routes.put('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.update)
routes.patch('/publisher/:publisher_id/unlink-publisher', is(['ADMIN_CONGREGATION']), PublisherControllers.unlinkPublisherFromUser)
routes.put('/publishers/transfer-congregation', is(['ADMIN_CONGREGATION']), PublisherControllers.transferPublishers)

/* === Contatos de emergência === */
routes.get('/emergencyContacts/:congregation_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), EmergencyContactController.listByCongregation)
routes.get('/emergencyContact/:emergencyContact_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), EmergencyContactController.getEmergencyContact)
routes.post('/emergencyContact', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController.create)
routes.put('/emergencyContact/:emergencyContact_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController.update)
routes.delete('/emergencyContact/:emergencyContact_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), EmergencyContactController.delete)

/* === Congregações === */
routes.post('/congregation', is(['ADMIN']), uploadFile.single('image'), CongregationController.create)
routes.delete('/congregation/:id', is(['ADMIN']), CongregationController.delete)
routes.get('/congregations', is(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController.list)
routes.get('/congregations/toTransfer', is(['ADMIN_CONGREGATION']), CongregationController.getCongregationSystemToTransferPublisher)
routes.put('/congregation/:congregation_id', is(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController.update)
routes.post('/congregation/:congregation_id/speakerCoordinator/:publisher_id', is(['ADMIN_CONGREGATION']), CongregationController.addAndUpdateSpeakerCoordinator)
routes.put('/congregation/:congregation_id/photo', is(['ADMIN', 'ADMIN_CONGREGATION']), uploadFile.single('image'), CongregationController.uploadCongregationPhoto)

/* === Congregações auxiliares === */
routes.get('/auxiliaryCongregations', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController.getAuxiliaryCongregations)
routes.post('/auxiliaryCongregations', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController.createAuxiliaryCongregation)
routes.patch('/auxiliaryCongregation/:congregation_id', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController.updateAuxiliaryCongregation)
routes.delete('/auxiliaryCongregation/:congregation_id', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), CongregationController.deleteAuxiliaryCongregation)

/* === Grupos de hospitalidade === */
routes.get('/congregation/:congregation_id/hospitalityGroups', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.getHospitalityGroups)
routes.get('/hospitalityGroup/:hospitalityGroup_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.getHospitalityGroup)
routes.post('/congregation/:congregation_id/hospitalityGroup', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.create)
routes.patch('/hospitalityGroup/:hospitalityGroup_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.update)
routes.patch('/congregation/:congregation_id/groups/reorder', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.reorderGroups)
routes.delete('/hospitalityGroup/:hospitalityGroup_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), HospitalityGroupController.delete)

/* === Categorias === */
routes.post('/category', is(['ADMIN']), CategoryController.create)
routes.put('/category/:category_id', is(['ADMIN']), CategoryController.update)

/* === Limpeza configurações === */
routes.post("/cleaning/schedule-config/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController.create);
routes.get("/cleaning/schedule-config/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController.getByCongregation);
routes.patch("/cleaning/schedule-config/:config_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController.update);
routes.get("/cleaning/schedule-config/:config_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController.getOne);
routes.delete("/cleaning/schedule-config/:config_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleConfigController.delete);

/* === Grupos de Limpeza === */
routes.post("/cleaning/groups/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController.create);
routes.get("/cleaning/groups/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController.getGroups);
routes.get("/cleaning/groups/:group_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController.getGroup);
routes.patch("/cleaning/groups/:group_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController.update);
routes.delete("/cleaning/groups/:groupId", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningGroupController.delete);

/* === Exceções de Limpeza === */
routes.post("/cleaning-exception/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController.create);
routes.get("/cleaning-exception/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController.getByCongregation);
routes.get("/cleaning-exception/:group_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController.getOne);
routes.patch("/cleaning-exception/:group_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController.update);
routes.delete("/cleaning-exception/:groupId", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningExceptionController.delete);

/* === Gerar programação de limpeza === */
routes.post("/cleaning/generate-schedule/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'CLEANING_MANAGER']), CleaningScheduleController.generate);
routes.get("/cleaning/schedule/congregation/:congregation_id", CleaningScheduleController.getFutureSchedules);

/* === Famílias === */

routes.post("/families/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController.create);
routes.get("/families/congregation/:congregation_id", is(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController.getFamilies);
routes.get("/families/:family_id", is(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController.getFamily);
routes.patch("/families/:family_id", is(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController.update);
routes.delete("/families/:family_id", is(['ADMIN_CONGREGATION', 'PUBLISHER_MANAGER']), FamilyController.delete);

/* === Documentos === */
routes.post('/new-document', is(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), uploadFile.single('file'), DocumentController.create)
routes.get('/documents-congregation/:congregation_id', DocumentController.filter)
routes.delete('/document/:document_id', is(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), DocumentController.delete)

/* === Perfis === */
routes.post('/profile/:user_id', uploadFile.single('avatar'), ProfileController.create)
routes.put('/profile/:profile_id', uploadFile.single('avatar'), ProfileController.update)
routes.delete('/profile/:id', ProfileController.delete)

/* === Territórios === */
routes.get('/territories/:congregation_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']), TerritoryController.getTerritories)
routes.get('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']), TerritoryController.getTerritory)
routes.post('/territory/:congregation_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), uploadFile.single('territory_image'), TerritoryController.create)
routes.put('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), uploadFile.single('territory_image'), TerritoryController.update)
routes.delete('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryController.delete)

/* === Histórico de territórios === */
routes.get('/territoriesHistory/:congregation_id', TerritoryHistoryController.getTerritoriesHistory)
routes.get('/territoryHistory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.getTerritoryHistory)
routes.post('/territoryHistory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.create)
routes.put('/territoryHistory/:territoryHistory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.update)
routes.delete('/territoryHistory/:territoryHistory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.delete)

/* === Funções e permissões === */
routes.post('/role', is(['ADMIN']), RoleController.create)
routes.get('/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), RoleController.getRoles)
routes.get('/role/:role_id', is(['ADMIN']), RoleController.getRole)
routes.delete('/role/:role_id', is(['ADMIN']), RoleController.delete)
routes.put('/role/:role_id', is(['ADMIN']), RoleController.update)

routes.post('/permission', is(['ADMIN']), PermissionController.create)
routes.put('/permission/:permission_id', is(['ADMIN']), PermissionController.update)
routes.delete('/permission/:permission_id', is(['ADMIN']), PermissionController.delete)
routes.get('/permission', is(['ADMIN']), PermissionController.getPermissions)
routes.get('/permission/:permission_id', is(['ADMIN']), PermissionController.getPermission)

/* === Anúncios === */
routes.post('/notice/:congregation_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.create)
routes.get('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.getNotice)
routes.delete('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.delete)
routes.put('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.update)

/* === Relatórios === */
routes.put('/report', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.updatePrivilege)
routes.post('/reportManually', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.createReportManually)
routes.delete('/report/:report_id', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.deleteReport)
routes.post('/report/totals/:congregation_id', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), TotalsReportsController.create)
routes.get('/report/totals/:congregation_id', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), TotalsReportsController.get)
routes.post('/report', ReportController.create)
routes.get('/reports/:congregationId', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER', 'REPORTS_VIEWER']), ReportController.getReports)
routes.get('/myReports', ReportController.getMyReports)

/* === Grupos === */
routes.post('/group/:group_id/add-publishers', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.addPublishersGroup)
routes.delete('/group/:group_id/remove-publishers', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.removePublishersGroup)
routes.delete('/group/:group_id', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.delete)
routes.post('/group', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.create)
routes.get('/groups/:congregation_id', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER', 'GROUPS_VIEWER']), GroupController.getGroups)
routes.put('/group/:group_id/change-groupOverseer', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.updateGroupOverseer)

/* === Assistência nas reuniões === */
routes.post('/assistance/:congregation_id', is(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER']), MeetingAssistanceController.create)
routes.get('/assistance/:congregation_id', is(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER', 'ASSISTANCE_VIEWER']), MeetingAssistanceController.getAssistance)

/* === Discursos === */
routes.post('/talk', is(['ADMIN']), TalkController.create)
routes.post('/talks', is(['ADMIN']), TalkController.importFromData)
routes.patch('/talk/:talk_id', is(['ADMIN']), TalkController.update)
routes.delete('/talk/:talk_id', is(['ADMIN']), TalkController.delete)
routes.get('/talk/:talk_id', is(['ADMIN', 'ADMIN_CONGREGATION', 'TALK_MANAGER']), TalkController.getTalk)
routes.get('/talks', is(['ADMIN', 'ADMIN_CONGREGATION', 'TALK_MANAGER']), TalkController.getTalks)

/* === Programação de fim de semana === */
routes.get('/congregation/:congregation_id/weekendSchedules', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController.getSchedules)
routes.get('/weekendSchedule/:weekendSchedule_id', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController.getSchedule)
routes.post('/congregation/:congregation_id/weekendSchedule', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController.create)
routes.patch('/weekendSchedule', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController.update)
routes.delete('/weekendSchedule/:weekendSchedule_id', is(['ADMIN_CONGREGATION', 'TALK_MANAGER']), WeekendScheduleController.delete)

/* === Hospitalidade === */
routes.post("/congregation/:congregation_id/hospitality/weekends", is(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController.createOrUpdateBatch)
routes.patch("/assignment/:assignment_id/status", is(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController.updateAssignmentStatus)
routes.delete("/assignment/:assignment_id", is(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController.deleteAssignment)
routes.delete("/weekend/:weekend_id", is(["ADMIN_CONGREGATION", "TALK_MANAGER"]), HospitalityController.deleteWeekend)

/* === Discursos externos === */
routes.post('/congregation/:congregation_id/externalTalks', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.create)
routes.get('/congregation/:congregation_id/externalTalks/', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.getExternalTalks)
routes.get('/congregation/:congregation_id/externalTalks/period', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.getExternalTalksByPeriod)
routes.patch('/externalTalk/:externalTalk_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.update)
routes.patch('/externalTalk/:externalTalk_id/status', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.updateStatus)
routes.delete('/externalTalk/:externalTalk_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), ExternalTalkController.delete)

/* === Oradores === */
routes.get('/speakers', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.getSpeakers)
routes.get('/my-congregation/speakers', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.getPublishersSpeaker)
routes.get('/speaker/:speaker_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.getSpeaker)
routes.post('/speaker', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.create)
routes.patch('/speaker/:speaker_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.update)
routes.delete('/speaker/:speaker_id', is(['ADMIN_CONGREGATION', "TALK_MANAGER"]), SpeakerController.delete)

/* === Field Service Templates === */

routes.post("/field-service/templates/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController.create);
routes.get("/field-service/templates/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController.getByCongregation);
routes.get("/field-service/templates/:template_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController.getOne);
routes.patch("/field-service/templates/:template_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController.update);
routes.delete("/field-service/templates/:template_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceTemplateController.delete);

/* === Field Service Schedules === */

routes.post("/field-service/templates/:template_id/schedules", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.create);
routes.post("/field-service/templates/:template_id/generate-schedules", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.generateByPeriod);

routes.get("/field-service/templates/:template_id/schedules", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.getByTemplate);
routes.get("/field-service/schedules/pdf/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.pdf);
routes.get("/field-service/schedules/:schedule_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.getOne);
routes.patch("/field-service/schedules/:schedule_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.update)
routes.delete("/field-service/schedules/:schedule_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceScheduleController.delete);

/* === Field Service Exceptions === */

routes.post("/field-service/exceptions/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController.create);
routes.get("/field-service/exceptions/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController.getByCongregation);
routes.get("/field-service/exceptions/:exception_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController.getOne);
routes.patch("/field-service/exceptions/:exception_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController.update);
routes.delete("/field-service/exceptions/:exception_id", is(["ADMIN_CONGREGATION", "FIELD_SERVICE_MANAGER"]), FieldServiceExceptionController.delete);

/* === Public Witness Arrangements === */

routes.post("/public-witness/arrangements/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController.create)
routes.get("/public-witness/arrangements/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController.getByCongregation)
routes.get("/public-witness/arrangements/:arrangement_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController.getOne)
routes.patch("/public-witness/arrangements/:arrangement_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController.update)
routes.delete("/public-witness/arrangements/:arrangement_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessArrangementController.delete)

/* === Public Witness Schedules === */
routes.post("/public-witness/arrangements/:arrangement_id/schedules", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController.createMultiple)
routes.get("/public-witness/arrangements/:arrangement_id/schedules", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController.getByDateRange)
routes.get("/public-witness/schedules/pdf/congregation/:congregation_id", is(["ADMIN_CONGREGATION", "PUBLIC_WITNESS_MANAGER"]), PublicWitnessScheduleController.getPdfByCongregation)


/* === Termos de uso (administração) === */
routes.post("/terms", is(['ADMIN']), TermsOfUseController.create)
routes.get("/terms", is(['ADMIN']), TermsOfUseController.list)
routes.delete("/terms/:term_id", is(['ADMIN']), TermsOfUseController.delete)

/* === Consentimentos LGPD (administração) === */
routes.get("/consent/congregation/:congregation_id", is(['ADMIN_CONGREGATION']), DataProcessingAgreementController.getByCongregation)

/* === Formulários === */
routes.get('/form-data', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'TALK_MANAGER']), FormDataController.getFormData)

/* === Cron Jobs === */
routes.get('/deleteExpiredNotices', verifyGitHubCron, CronJobController.deleteExpiredNotices)
routes.delete('/cron/clean-old-schedules', verifyGitHubCron, CronJobController.cleanOldData)
routes.get('/reportsCleanUp', verifyCronSecret, CronJobController.reportsCleanUp)
routes.get('/backup', verifyCronSecret, CronJobController.backup)
routes.get("/usage", is(["ADMIN"]), VercelUsageController.getUsage);

export default routes
