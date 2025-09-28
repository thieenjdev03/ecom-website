"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailController = void 0;
var common_1 = require("@nestjs/common");
var MailController = function () {
    var _classDecorators = [(0, common_1.Controller)('mail')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _sendOrderConfirmation_decorators;
    var _sendPasswordReset_decorators;
    var _sendWelcomeEmail_decorators;
    var MailController = _classThis = /** @class */ (function () {
        function MailController_1(mailService) {
            this.mailService = (__runInitializers(this, _instanceExtraInitializers), mailService);
        }
        MailController_1.prototype.sendOrderConfirmation = function (orderData) {
            return this.mailService.sendOrderConfirmation(orderData);
        };
        MailController_1.prototype.sendPasswordReset = function (data) {
            return this.mailService.sendPasswordReset(data.email, data.resetToken);
        };
        MailController_1.prototype.sendWelcomeEmail = function (data) {
            return this.mailService.sendWelcomeEmail(data.email, data.name);
        };
        return MailController_1;
    }());
    __setFunctionName(_classThis, "MailController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _sendOrderConfirmation_decorators = [(0, common_1.Post)('order-confirmation')];
        _sendPasswordReset_decorators = [(0, common_1.Post)('password-reset')];
        _sendWelcomeEmail_decorators = [(0, common_1.Post)('welcome')];
        __esDecorate(_classThis, null, _sendOrderConfirmation_decorators, { kind: "method", name: "sendOrderConfirmation", static: false, private: false, access: { has: function (obj) { return "sendOrderConfirmation" in obj; }, get: function (obj) { return obj.sendOrderConfirmation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendPasswordReset_decorators, { kind: "method", name: "sendPasswordReset", static: false, private: false, access: { has: function (obj) { return "sendPasswordReset" in obj; }, get: function (obj) { return obj.sendPasswordReset; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendWelcomeEmail_decorators, { kind: "method", name: "sendWelcomeEmail", static: false, private: false, access: { has: function (obj) { return "sendWelcomeEmail" in obj; }, get: function (obj) { return obj.sendWelcomeEmail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MailController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MailController = _classThis;
}();
exports.MailController = MailController;
