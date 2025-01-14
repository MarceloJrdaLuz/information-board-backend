import { Router } from "express"
import UserController from "./controllers/UserController"
import CongregationController from "./controllers/CongregationController"
import ProfileController from "./controllers/ProfileController"
import DocumentController from "./controllers/DocumentController"
import CategoryController from "./controllers/CategoryController"
import RoleController from "./controllers/RoleController"
import PermissionController from "./controllers/PermissionController"
import { is, verifyCronSecret } from "./middlewares/permissions"
import { uploadFile } from "./config/multer"
import PublisherControllers from "./controllers/PublisherControllers"
import ReportController from "./controllers/ReportController"
import GroupController from "./controllers/GroupController"
import ConsentRecordController from "./controllers/ConsentRecordController"
import NoticeController from "./controllers/NoticeController"
import TotalsReportsController from "./controllers/TotalsReportsController"
import MeetingAssistanceController from "./controllers/MeetingAssistanceController"
import CronJobController from "./controllers/CronJobController"
import TerritoryController from "./controllers/TerritoryController"
import TerritoryHistoryController from "./controllers/TerritoryHistoryController"

const routes = Router()

routes.post('/user', UserController.create) //
routes.post('/login', UserController.login) //
routes.post('/recover-user-information', UserController.recoverUserInformation) //
routes.post('/forgot_password', UserController.forgot_password) //
routes.post('/reset_password', UserController.reset_password) //
routes.post('/add-domain', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.addUserDomain)
routes.put('/user/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.updateRoles)
routes.get('/users', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.getUsers)

routes.get('/publishers/congregationId/:congregation_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), PublisherControllers.getPublishers)
routes.get('/publishers/congregationNumber/:congregationNumber', PublisherControllers.getPublishersWithCongregatioNumber)
routes.get('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.getPublisher)
routes.post('/publisher', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.create)
routes.delete('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.delete)
routes.put('/publisher/:publisher_id', is(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers.update)

routes.post('/congregation', is(['ADMIN']), uploadFile.single('image'), CongregationController.create) //
routes.delete('/congregation/:id', is(['ADMIN']), CongregationController.delete)
routes.get('/congregations', is(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController.list)
routes.get('/congregation/:number', CongregationController.getCongregation)
routes.put('/congregation/:congregation_id', is(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController.update)
routes.put('/congregation/:congregation_id/photo', is(['ADMIN', 'ADMIN_CONGREGATION']), uploadFile.single('image'), CongregationController.uploadCongregationPhoto)

routes.post('/category', is(['ADMIN']), CategoryController.create)
routes.put('/category/:category_id', is(['ADMIN']), CategoryController.update)
routes.get('/categories', CategoryController.getCategories)
routes.get('/category/:category_id', CategoryController.getPermission)

routes.post('/new-document', is(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), uploadFile.single('file'), DocumentController.create)
routes.get('/documents-congregation/:congregation_id', DocumentController.filter)
routes.delete('/document/:document_id', is(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), DocumentController.delete)

routes.post('/profile/:user_id', uploadFile.single('avatar'), ProfileController.create)
routes.put('/profile/:profile_id', uploadFile.single('avatar'), ProfileController.update)
routes.delete('/profile/:id', ProfileController.delete)

routes.get('/territories/:congregation_id',  is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']), TerritoryController.getTerritories)
routes.get('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER', 'TERRITORIES_VIEWER']),  TerritoryController.getTerritory)
routes.post('/territory/:congregation_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), uploadFile.single('territory_image'), TerritoryController.create)
routes.put('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), uploadFile.single('territory_image'), TerritoryController.update)
routes.delete('/territory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryController.delete)

routes.get('/territoriesHistory/:congregation_id',  TerritoryHistoryController.getTerritoriesHistory)
routes.get('/territoryHistory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.getTerritoryHistory)
routes.post('/territoryHistory/:territory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.create)
routes.put('/territoryHistory/:territoryHistory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.update)
routes.delete('/territoryHistory/:territoryHistory_id', is(['ADMIN_CONGREGATION', 'TERRITORIES_MANAGER']), TerritoryHistoryController.delete)

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

routes.get('/notices/:congregation_id', NoticeController.getNotices)
routes.post('/notice/:congregation_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.create)
routes.get('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.getNotice)
routes.delete('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.delete)
routes.put('/notice/:notice_id', is(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController.update)

routes.put('/report', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.updatePrivilege)
routes.post('/reportManually', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.createReportManually)
routes.delete('/report/:report_id', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER']), ReportController.deleteReport)
routes.post('/report/totals/:congregation_id', TotalsReportsController.create)
routes.get('/report/totals/:congregation_id', TotalsReportsController.get)
routes.post('/report', ReportController.create)
routes.get('/reports/:congregationId', is(['ADMIN_CONGREGATION', 'REPORTS_MANAGER', 'REPORTS_VIEWER']), ReportController.getReports)

routes.post('/group/:group_id/add-publishers', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.addPublishersGroup)
routes.delete('/group/:group_id/remove-publishers', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.removePublishersGroup)
routes.delete('/group/:group_id', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.delete)
routes.post('/group', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.create)
routes.get('/groups/:congregation_id', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER', 'GROUPS_VIEWER']), GroupController.getGroups)
routes.put('/group/:group_id/change-groupOverseer', is(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController.updateGroupOverseer)

routes.post('/consentRecord', ConsentRecordController.create)
routes.post('/checkConsentRecords', ConsentRecordController.checkConsent)

routes.post('/assistance/:congregation_id', is(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER']), MeetingAssistanceController.create)
routes.get('/assistance/:congregation_id', is(['ADMIN_CONGREGATION', 'ASSISTANCE_MANAGER', 'ASSISTANCE_VIEWER']), MeetingAssistanceController.getAssistance)

routes.get('/deleteExpiredNotices', verifyCronSecret, CronJobController.deleteExpiredNotices)
routes.get('/reportsCleanUp', verifyCronSecret, CronJobController.reportsCleanUp)
routes.get('/backup', verifyCronSecret, CronJobController.backup)

export default routes