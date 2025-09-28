"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jwt_guard_1 = require("./jwt.guard");
describe('JwtGuard', function () {
    it('should be defined', function () {
        expect(new jwt_guard_1.JwtGuard()).toBeDefined();
    });
});
