//var formatErrors = require("../lib/formatErrors");
var assert = require("assert");
var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");
var util = require("util");

var formatErrorsModule = loadModule("./lib/formatErrors.js");
var formatErrorsExports = formatErrorsModule.module.exports;

exports.testStackRange = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var formatted = formatErrorsExports.stackRange(error.stack, 0, 5);
        var lines = formatted.split('\n');
        should.equal(6, lines.length);
        should.equal("Error: an error", lines[0]);
        lines[1].should.include("testFormatError");

        formatted = formatErrorsExports.stackRange(error.stack, 1);
        lines = formatted.split('\n');
        lines[1].should.not.include("testFormatError");
        lines.length.should.be.above(5);
        lines[lines.length - 2].should.include("nodeunit");

        var another = formatErrorsExports.stackRange(error.stack, 0, 200);
        another.should.equal(another);
        another.should.equal(error.stack);

        formatted = formatErrorsExports.stackRange(error.stack, 0, 1);
        lines = formatted.split('\n');
        should.equal(2, lines.length);
        should.equal("Error: an error", lines[0]);
        lines[1].should.include("testFormatErrors");

        test.done();
    }
};

exports.testMultiLineMessageStackRange = function (test) {
    try {
        throw new Error("a multi\nline\nerror\nmessage");
    } catch (error) {
        var formatted = formatErrorsExports.stackRange(error.stack, 0, 5);
        var lines = formatted.split('\n');
        should.equal(9, lines.length);
        should.equal("Error: a multi", lines[0]);
        should.equal("message", lines[3]);
        lines[4].should.include("testFormatError");
        test.done();
    }
};

exports.testStackFilter = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var filters = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrorsExports.stackFilter(error.stack, filters, true);
        var lines = formatted.split("\n");
        lines[1].should.include("testFormatErrors");
        for (var i = 2; i < lines.length - 1; i++) {
            lines[i].should.include("nodeunit");
        }
        formatted.should.equal(error.stack);

        filters = ["testFormatErrors"];
        formatted = formatErrorsExports.stackFilter(error.stack, filters, true);
        lines = formatted.split("\n");
        lines[1].should.include("testFormatErrors");
        lines.length.should.equal(3);

        var another = formatErrorsExports.stackFilter(error.stack, filters);
        another.should.equal(formatted);

        filters = ["testFormatErrors", "nodeunit"];
        formatted = formatErrorsExports.stackFilter(error.stack, filters, false);
        lines = formatted.split("\n");
        for (i = 1; i < lines.length - 1; i++) {
            lines[i].should.not.include("nodeunit");
            lines[i].should.not.include("testFormatErrors");
        }

        test.done();
    }
};

exports.testMultiLineMessageStackFilter = function (test) {
    try {
        throw new Error("a multi\nline\nerror\nmessage");
    } catch (error) {
        var filters = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrorsExports.stackFilter(error.stack, filters, true);
        formatted.should.equal(error.stack);
        formatted = formatErrorsExports.stackFilter(error.stack, filters, false);
        formatted.should.not.equal(error.stack);
        var lines = formatted.split("\n");
        for(var i=0; i<lines.length; i++) {
            formatErrorsModule.isMessageLine(lines[i]).should.equal(true);
        }
        test.done();
    }
};

exports.testStackHighlight = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var patterns = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrorsExports.stackHighlight(error.stack, patterns, formatErrorsExports.styles.RED);
        var lines = formatted.split("\n");
        lines[0].should.not.include(formatErrorsExports.styles.RED);
        lines[0].should.not.include(formatErrorsExports.styles.NORMAL);
        lines[1].should.include("testFormatErrors");
        lines[1].indexOf(formatErrorsExports.styles.RED).should.equal(0);
        lines[1].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[1].length - formatErrorsExports.styles.NORMAL.length);
        lines[1].should.not.include("undefined");
        for (var i = 2; i < lines.length - 1; i++) {
            lines[i].should.not.include("undefined");
            lines[i].should.include("nodeunit");
            lines[i].indexOf(formatErrorsExports.styles.RED).should.equal(0);
            lines[i].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[i].length - formatErrorsExports.styles.NORMAL.length);
        }
        patterns = ["testFormatErrors"];
        formatted = formatErrorsExports.stackHighlight(error.stack, patterns,
            [formatErrorsExports.styles.GREEN, formatErrorsExports.styles.BOLD]);
        lines = formatted.split("\n");
        lines[0].should.not.include(formatErrorsExports.styles.GREEN);
        lines[0].should.not.include(formatErrorsExports.styles.BOLD);
        lines[0].should.not.include(formatErrorsExports.styles.NORMAL);
        lines[1].should.include("testFormatErrors");
        lines[1].should.not.include("undefined");
        lines[1].indexOf(formatErrorsExports.styles.GREEN).should.equal(0);
        lines[1].indexOf(formatErrorsExports.styles.BOLD).should.equal(formatErrorsExports.styles.GREEN.length);
        lines[1].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[1].length - formatErrorsExports.styles.NORMAL.length);
        for (i = 2; i < lines.length - 1; i++) {
            lines[i].should.not.include("undefined");
            lines[i].should.include("nodeunit");
            lines[i].should.not.include(formatErrorsExports.styles.GREEN);
            lines[i].should.not.include(formatErrorsExports.styles.BOLD);
            lines[i].should.not.include(formatErrorsExports.styles.NORMAL);
        }
        test.done();
    }
};

exports.testMultiLineMessageStackHighlight = function (test) {
    try {
        throw new Error("a multi\nline\nerror\nmessage");
    } catch (error) {
        var patterns = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrorsExports.stackHighlight(error.stack, patterns, formatErrorsExports.styles.RED);
        var lines = formatted.split("\n");
        lines[0].should.not.include(formatErrorsExports.styles.RED);
        lines[0].should.not.include(formatErrorsExports.styles.NORMAL);
        lines[3].should.not.include(formatErrorsExports.styles.RED);
        lines[3].should.not.include(formatErrorsExports.styles.NORMAL);
        lines[4].should.include("testFormatErrors");
        lines[4].indexOf(formatErrorsExports.styles.RED).should.equal(0);
        lines[4].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[4].length - formatErrorsExports.styles.NORMAL.length);
        lines[4].should.not.include("undefined");
        for (var i = 5; i < lines.length - 1; i++) {
            lines[i].should.not.include("undefined");
            lines[i].should.include("nodeunit");
            lines[i].indexOf(formatErrorsExports.styles.RED).should.equal(0);
            lines[i].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[i].length - formatErrorsExports.styles.NORMAL.length);
        }
        test.done();
    }
};

exports.testStackFilterNoFilters = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var formatted = formatErrorsExports.stackFilter(error.stack, null, true);
        var lines = formatted.split("\n");
        lines.length.should.equal(2);
        formatted = formatErrorsExports.stackFilter(error.stack, null, false);
        lines = formatted.split("\n");
        lines.length.should.be.above(10);
        formatted.should.equal(error.stack);

        test.done();
    }
};

exports.testStackFormatChaining = function (test) {
    try {
        var assertion = function() {
            false.should.equal(true);
        };
        assertion();
    } catch (error) {
        var formatted = formatErrorsExports.stackHighlight(
            formatErrorsExports.stackHighlight(
                formatErrorsExports.stackRange(error.stack, 2), ["testFormatErrors"], [formatErrorsExports.styles.BOLD], true
            ), ["Error:"], [formatErrorsExports.styles.BOLD, formatErrorsExports.styles.RED]
        );

        var lines = formatted.split("\n");
        lines[0].indexOf(formatErrorsExports.styles.BOLD).should.equal(0);
        lines[0].indexOf(formatErrorsExports.styles.RED).should.equal(formatErrorsExports.styles.BOLD.length);
        lines[0].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[0].length - formatErrorsExports.styles.NORMAL.length);
        for (var i = 1; i < 2; i++) {
            lines[i].indexOf(formatErrorsExports.styles.BOLD).should.equal(0);
            lines[i].should.not.include(formatErrorsExports.styles.RED);
            lines[i].should.not.include("should");
            lines[i].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[i].length - formatErrorsExports.styles.NORMAL.length);
        }
        for(i=3; i<lines.length; i++) {
            lines[i].should.not.include("should");
            lines[i].should.not.include(formatErrorsExports.styles.BOLD);
            lines[i].should.not.include(formatErrorsExports.styles.RED);
            lines[i].should.not.include(formatErrorsExports.styles.NORMAL);
        }
        test.done();
    }
};

exports.testApplyHighlightStackFormat = function (test) {
    try {
        true.should.equal(false);
    } catch (error) {
        var formatted = formatErrorsExports.applyHighlightStackFormat(
            error.stack,
            [formatErrorsExports.styles.BLUE, formatErrorsExports.styles.BOLD],
            [formatErrorsExports.styles.BOLD],
            ["testFormatErrors"]
        );
        var lines = formatted.split("\n");
        lines[2].should.include("testFormatErrors");
        lines[2].should.not.include("undefined");
        test.done();
    }
};

exports.testHighlightStackMessage = function (test) {
    try {
        true.should.equal(false);
    } catch (error) {
        var formatted = formatErrorsExports.highlightStackMessage(error.stack, [formatErrorsExports.styles.BLUE]);
        var lines = formatted.split("\n");
        lines[0].indexOf(formatErrorsExports.styles.BLUE).should.equal(0);
        lines[0].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[0].length - formatErrorsExports.styles.NORMAL.length);
        formatted = formatErrorsExports.highlightStackMessage(error.stack, [formatErrorsExports.styles.CYAN, formatErrorsExports.styles.BOLD]);
        lines = formatted.split("\n");
        lines[0].indexOf(formatErrorsExports.styles.CYAN).should.equal(0);
        lines[0].indexOf(formatErrorsExports.styles.BOLD).should.equal(formatErrorsExports.styles.CYAN.length);
        lines[0].indexOf(formatErrorsExports.styles.NORMAL).should.equal(lines[0].length - formatErrorsExports.styles.NORMAL.length);
        for(var i=1; i<lines.length; i++) {
            lines[i].should.not.include(formatErrorsExports.styles.CYAN);
            lines[i].should.not.include(formatErrorsExports.styles.BOLD);
            lines[i].should.not.include(formatErrorsExports.styles.NORMAL);
        }

        test.done();
    }
};

exports.testBoldMessageBoldModuleStack = function (test) {
    try {
        true.should.equal(false);
    } catch (error) {
        var formatted = formatErrorsExports.boldMessageBoldModuleStack(error.stack, "testFormatErrors");
        var lines = formatted.split("\n");
        lines[0].indexOf(formatErrorsExports.styles.BOLD).should.equal(0);
        lines[1].should.not.include(formatErrorsExports.styles.BOLD);
        lines[2].indexOf(formatErrorsExports.styles.BOLD).should.equal(0);
        lines[3].should.not.include(formatErrorsExports.styles.BOLD);
        test.done();
    }
};

exports.testStackLineType = function (test) {
    try {
        true.should.equal(false);
    } catch (error) {
        var lines = error.stack.split('\n');
        formatErrorsModule.isStackLine(lines[0]).should.equal(false);
        formatErrorsModule.isMessageLine(lines[0]).should.equal(true);
        for(var i = 1; i < lines.length; i++) {
            formatErrorsModule.isStackLine(lines[i]).should.equal(true);
            formatErrorsModule.isMessageLine(lines[i]).should.equal(false);
        }
        test.done();
    }
};

exports.testFormatAssertionError = function (test) {
//    var e1, e2;
//    try {
//        true.should.equal(false);
//    } catch (error) {
//        console.log(util.inspect(error));
//        e1 = error;
//    }
//
//    try {
//        assert.equal(true, false);
//    } catch (error) {
//        console.log(util.inspect(error));
//        e2 = error;
//    }
//
//    try {
//        assert.deepEqual(e1, e2);
//    } catch (error) {
//        console.log(util.inspect(error));
//    }
//    assert.deepEqual(e1, e2);
//
    test.done();
};
