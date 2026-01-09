"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonResponse = jsonResponse;
exports.noContentResponse = noContentResponse;
exports.errorResponse = errorResponse;
const baseHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
function jsonResponse(statusCode, payload) {
    return {
        statusCode,
        headers: {
            ...baseHeaders,
            'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
    };
}
function noContentResponse(statusCode) {
    return {
        statusCode,
        headers: baseHeaders,
        body: '',
    };
}
function errorResponse(statusCode, message) {
    return jsonResponse(statusCode, { error: message });
}
//# sourceMappingURL=response.js.map