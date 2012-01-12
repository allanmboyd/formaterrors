var assert = require("assert");
var formatErrors = require("../lib/formatErrors");
var should = require("should");
var util = require("util");

var e1, e2;
try {
    true.should.equal(false);
} catch (error) {
    console.log("\nShould Equal");
    console.log("------------\n");
    console.log(formatErrors.boldMessageBoldModuleStack(error.stack, "sample"));
    e1 = error;
}

try {
    assert.equal(true, false);
} catch (error) {
    console.log("\nAssert Equal");
    console.log("------------\n");
    console.log(formatErrors.boldMessageBoldModuleStack(error.stack, "sample"));
    e2 = error;
}

try {
    assert.deepEqual(e1, e2);
} catch (error) {
    console.log("\nAssert Deep Equal");
    console.log("-----------------\n");
    console.log(formatErrors.boldMessageBoldModuleStack(error.stack, "sample"));
}

try {
    e1.should.equal(e2);
} catch (error) {
    console.log("\nShould Equal Objects");
    console.log("--------------------\n");
    console.log(formatErrors.boldMessageBoldModuleStack(error.stack, "sample"));
}