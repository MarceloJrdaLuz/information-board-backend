import { Router } from "express";
import UserController from "./controllers/UserController";
import CongregationController from "./controllers/CongregationController";
import ProfileController from "./controllers/ProfileController";

const routes = Router()

routes.post('/create-user', UserController.create)
routes.post('/login', UserController.login)

routes.post('/create-congregation', CongregationController.create)

routes.post('/create-profile', ProfileController.create)
routes.post('/create-profile', ProfileController.create)
routes.put('/update-profile', ProfileController.update)


export default routes