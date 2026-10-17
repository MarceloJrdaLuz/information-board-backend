"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passkeyCredentialRepository = void 0;
const data_source_1 = require("../data-source");
const PasskeyCredential_1 = require("../entities/PasskeyCredential");
exports.passkeyCredentialRepository = data_source_1.AppDataSource.getRepository(PasskeyCredential_1.PasskeyCredential);
