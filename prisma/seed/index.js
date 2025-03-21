"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var roleDefault_1 = require("./roleDefault");
var adminDefault_1 = require("./adminDefault");
var companyDefault_1 = require("./companyDefault");
var departmentDefault_1 = require("./departmentDefault");
var jobPositionDefault_1 = require("./jobPositionDefault");
var employmentStatusDefault_1 = require("./employmentStatusDefault");
var questionDefault_1 = require("./questionDefault");
var applications_1 = require("../../src/applications");
var utils_1 = require("../../src/utils");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, applications_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b, _loop_1, _i, questionDefault_2, question;
                        var _c;
                        var _this = this;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, tx.role.deleteMany({})];
                                case 1:
                                    _d.sent();
                                    return [4 /*yield*/, tx.role.createMany({ data: roleDefault_1.roleDefault })];
                                case 2:
                                    _d.sent();
                                    return [4 /*yield*/, tx.company.deleteMany({})];
                                case 3:
                                    _d.sent();
                                    return [4 /*yield*/, tx.company.createMany({ data: companyDefault_1.companyDefault })];
                                case 4:
                                    _d.sent();
                                    return [4 /*yield*/, tx.department.deleteMany({})];
                                case 5:
                                    _d.sent();
                                    return [4 /*yield*/, tx.department.createMany({ data: departmentDefault_1.departmentDefault })];
                                case 6:
                                    _d.sent();
                                    return [4 /*yield*/, tx.jobPosition.deleteMany({})];
                                case 7:
                                    _d.sent();
                                    return [4 /*yield*/, tx.jobPosition.createMany({ data: jobPositionDefault_1.jobPositionDefault })];
                                case 8:
                                    _d.sent();
                                    return [4 /*yield*/, tx.employmentStatus.deleteMany({})];
                                case 9:
                                    _d.sent();
                                    return [4 /*yield*/, tx.employmentStatus.createMany({ data: employmentStatusDefault_1.employmentStatusDefault })];
                                case 10:
                                    _d.sent();
                                    return [4 /*yield*/, tx.user.deleteMany({})];
                                case 11:
                                    _d.sent();
                                    _b = (_a = tx.user).createMany;
                                    _c = {};
                                    return [4 /*yield*/, Promise.all(adminDefault_1.adminDefault.map(function (user) { return __awaiter(_this, void 0, void 0, function () {
                                            var _a;
                                            var _b;
                                            return __generator(this, function (_c) {
                                                switch (_c.label) {
                                                    case 0:
                                                        _a = [__assign({}, user)];
                                                        _b = {};
                                                        return [4 /*yield*/, (0, utils_1.hashPassword)(user.password)];
                                                    case 1: return [2 /*return*/, (__assign.apply(void 0, _a.concat([(_b.password = _c.sent(), _b.birth_date = new Date(user.birth_date), _b)])))];
                                                }
                                            });
                                        }); }))];
                                case 12: return [4 /*yield*/, _b.apply(_a, [(_c.data = _d.sent(),
                                            _c)])];
                                case 13:
                                    _d.sent();
                                    return [4 /*yield*/, tx.question.deleteMany({})];
                                case 14:
                                    _d.sent();
                                    _loop_1 = function (question) {
                                        return __generator(this, function (_e) {
                                            switch (_e.label) {
                                                case 0: return [4 /*yield*/, tx.question.create({
                                                        data: {
                                                            question: question.question,
                                                            question_answer: {
                                                                createMany: {
                                                                    data: question.answer.map(function (answer, index) { return ({
                                                                        question_answer: answer,
                                                                        value: question.value[index],
                                                                    }); }),
                                                                },
                                                            },
                                                        },
                                                    })];
                                                case 1:
                                                    _e.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, questionDefault_2 = questionDefault_1.questionDefault;
                                    _d.label = 15;
                                case 15:
                                    if (!(_i < questionDefault_2.length)) return [3 /*break*/, 18];
                                    question = questionDefault_2[_i];
                                    return [5 /*yield**/, _loop_1(question)];
                                case 16:
                                    _d.sent();
                                    _d.label = 17;
                                case 17:
                                    _i++;
                                    return [3 /*break*/, 15];
                                case 18: return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, applications_1.prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, applications_1.prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
