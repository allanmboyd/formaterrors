var formatErrors = require("../lib/formatErrors");
var should = require("should");
var util = require("util");

exports.testStackRange = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var formatted = formatErrors.stackRange(error.stack, 0, 5);
        var lines = formatted.split('\n');
        should.equal(6, lines.length);
        should.equal("Error: an error", lines[0]);
        lines[1].should.include("testFormatError");

        formatted = formatErrors.stackRange(error.stack, 0);
        lines = formatted.split('\n');
        lines.length.should.be.above(5);
        lines[lines.length - 2].should.include("nodeunit");

        var another = formatErrors.stackRange(error.stack, 0, 200);
        another.should.equal(formatted);
        another.should.equal(error.stack);

        formatted = formatErrors.stackRange(error.stack, 1, 1);
        lines = formatted.split('\n');
        should.equal(3, lines.length);
        should.equal("Error: an error", lines[0]);
        lines[1].should.include("testFormatErrors");

        test.done();
    }
};

exports.testStackFilter = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var filters = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrors.stackFilter(error.stack, filters, true);
        var lines = formatted.split("\n");
        lines[1].should.include("testFormatErrors");
        for (var i = 2; i < lines.length - 1; i++) {
            lines[i].should.include("nodeunit");
        }
        formatted.should.equal(error.stack);

        filters = ["testFormatErrors"];
        formatted = formatErrors.stackFilter(error.stack, filters, true);
        lines = formatted.split("\n");
        lines[1].should.include("testFormatErrors");
        lines.length.should.equal(3);

        var another = formatErrors.stackFilter(error.stack, filters);
        another.should.equal(formatted);

        filters = ["testFormatErrors", "nodeunit"];
        formatted = formatErrors.stackFilter(error.stack, filters, false);
        lines = formatted.split("\n");
        for (i = 1; i < lines.length - 1; i++) {
            lines[i].should.not.include("nodeunit");
            lines[i].should.not.include("testFormatErrors");
        }

        test.done();
    }
};

exports.testStackHighlight = function (test) {
    try {
        throw new Error("an error");
    } catch (error) {
        var patterns = ["testFormatErrors", "nodeunit"];
        var formatted = formatErrors.stackHighlight(error.stack, patterns, formatErrors.styles.RED);
        var lines = formatted.split("\n");
        lines[0].should.not.include(formatErrors.styles.RED);
        lines[0].should.not.include(formatErrors.styles.NORMAL);
        lines[1].should.include("testFormatErrors");
        lines[1].indexOf(formatErrors.styles.RED).should.equal(0);
        lines[1].indexOf(formatErrors.styles.NORMAL).should.equal(lines[1].length - formatErrors.styles.NORMAL.length);
        for (var i = 2; i < lines.length - 1; i++) {
            lines[i].should.include("nodeunit");
            lines[i].indexOf(formatErrors.styles.RED).should.equal(0);
            lines[i].indexOf(formatErrors.styles.NORMAL).should.equal(lines[i].length - formatErrors.styles.NORMAL.length);
        }
        patterns = ["testFormatErrors"];
        formatted = formatErrors.stackHighlight(error.stack, patterns,
            [formatErrors.styles.GREEN, formatErrors.styles.BOLD]);
        lines = formatted.split("\n");
        lines[0].should.not.include(formatErrors.styles.GREEN);
        lines[0].should.not.include(formatErrors.styles.BOLD);
        lines[0].should.not.include(formatErrors.styles.NORMAL);
        lines[1].should.include("testFormatErrors");
        lines[1].indexOf(formatErrors.styles.GREEN).should.equal(0);
        lines[1].indexOf(formatErrors.styles.BOLD).should.equal(formatErrors.styles.GREEN.length);
        lines[1].indexOf(formatErrors.styles.NORMAL).should.equal(lines[1].length - formatErrors.styles.NORMAL.length);
        for (i = 2; i < lines.length - 1; i++) {
            lines[i].should.include("nodeunit");
            lines[i].should.not.include(formatErrors.styles.GREEN);
            lines[i].should.not.include(formatErrors.styles.BOLD);
            lines[i].should.not.include(formatErrors.styles.NORMAL);
        }
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
        var formatted = formatErrors.stackHighlight(
            formatErrors.stackHighlight(
                formatErrors.stackRange(error.stack, 2), ["testFormatErrors"], [formatErrors.styles.BOLD]
            ), ["Error:"], [formatErrors.styles.BOLD, formatErrors.styles.RED]
        );

        var lines = formatted.split("\n");
        lines[0].indexOf(formatErrors.styles.BOLD).should.equal(0);
        lines[0].indexOf(formatErrors.styles.RED).should.equal(formatErrors.styles.BOLD.length);
        lines[0].indexOf(formatErrors.styles.NORMAL).should.equal(lines[0].length - formatErrors.styles.NORMAL.length);
        for (var i = 1; i < 2; i++) {
            lines[i].indexOf(formatErrors.styles.BOLD).should.equal(0);
            lines[i].should.not.include(formatErrors.styles.RED);
            lines[i].should.not.include("should");
            lines[i].indexOf(formatErrors.styles.NORMAL).should.equal(lines[i].length - formatErrors.styles.NORMAL.length);
        }
        for(i=3; i<lines.length; i++) {
            lines[i].should.not.include("should");
            lines[i].should.not.include(formatErrors.styles.BOLD);
            lines[i].should.not.include(formatErrors.styles.RED);
            lines[i].should.not.include(formatErrors.styles.NORMAL);
        }
        test.done();
    }
};
