/**
 * An API that provides various options for formatting and highlighting Errors. May be useful for logging and test
 * frameworks for example.
 *
 * Stack lines can be filtered in and out based on patterns and limited by range (e.g. lines 2 through 10). Stack lines
 * and error message can have highlights applied based on patterns. Finally stack lines can be formatted to include or
 * exclude available fields.
 *
 * The API is quite flexible with a range of methods varying in level with means to specify custom highlights and
 * formats.
 * @module formaterrors
 * @class formaterrors
 * @requires googlediff, stack-trace
 */
var diffMatchPatch = new (require("googlediff"));
var stackTrace = require("stack-trace");

var LONG_EXPECTED = 40;
var LONG_ACTUAL = 40;
var DEFAULT_FORMAT = new StackFormat();

/**
 * Format the stack part (i.e. the stack lines not the message part in the stack) according to a specified StackFormat.
 * (See exports.StackFormat for available stack line fields.)
 *
 * @param error the error whose stack to format
 * @param stackFormat the StackFormat specification
 * @return the given error with its stack modified according to the given StackFormat
 */
exports.formatStack = function (error, stackFormat) {
    return formatStackInternal(error, getMessages(error).join(" ") + "\n", stackFormat);
};

/**
 * @param assertionError an AssertionError
 * @param stackTheme a StackTheme (see exports.StackTheme)
 * @return the given assertionError with stack hightlighted according to the StackTheme specification
 */
exports.highlightAssertionError = function (assertionError, stackTheme) {
    if (isActualExpectedError(assertionError) && assertionError.expected.length >= LONG_EXPECTED &&
        assertionError.actual.length >= LONG_ACTUAL) {
        var diff = diffMatchPatch.diff_main(assertionError.expected.toString(), assertionError.actual.toString());
        diffMatchPatch.diff_cleanupSemantic(diff);
        assertionError.diff = diff;
        var message = diffToMessage(assertionError);
        assertionError = formatStackInternal(assertionError, message, DEFAULT_FORMAT);
    }

    assertionError.stack = exports.applyStackTheme(assertionError.stack, stackTheme);

    return assertionError;
};

/**
 * Convenience function that highlights the message line and all module related lines in bold.
 *
 * @param stack an Error stack
 * @param moduleName the name of a module whose stack lines to highlight in bold
 * @return a new error stack with bold message and module entries.
 */
exports.boldMessageBoldModuleStack = function (stack, moduleName) {
    var format = new exports.StackTheme();
    format.messageLineHighlights = [exports.STYLES.BOLD];
    format.stackHighlights = [exports.STYLES.BOLD];
    format.stackHighlightPatterns = [moduleName];
    return exports.applyStackTheme(stack, format);
};

/**
 * Convenience function to apply a given set of highlights to a an error stack.
 *
 * @param stack an Error stack
 * @param messageLineHighlights an array of prefixes to be applied to the first line of the stack
 * (e.g. [exports.styles.RED, exports.styles.BOLD])
 * @param stackHighlights an array of prefixes to be applied to each line (e.g. [exports.styles.RED,
 * exports.styles.BOLD]) matching one or more of the provided "stackPatterns"
 * @param stackPatterns an array of regular expressions against which to perform match operations on each line of the stack
 * @param inclusive use the patterns to include or exclude from the stack. Defaults to true.
 * @return a new error stack String highlighted as specified by the parameters
 */
exports.applyStackHighlights = function (stack, messageLineHighlights, stackHighlights, stackPatterns, inclusive) {
    var format = new exports.StackTheme();
    format.messageLineHighlights = messageLineHighlights;
    format.stackHighlights = stackHighlights;
    format.stackHighlightPatterns = stackPatterns;
    format.highlightInclusive = inclusive;
    return exports.applyStackTheme(stack, format);
};

/**
 * Convenience method to apply multiple transformations to an error stack.
 *
 * @param stack an error stack
 * @param theme a StackTheme (see exports.StackTheme)
 * @return a new error stack String transformed according to the specificied StackFormat
 */
exports.applyStackTheme = function (stack, theme) {
    var newStack = stack;
    if (theme.stackRange.start) {
        newStack = exports.stackRange(newStack, theme.stackRange.start, theme.stackRange.depth);
    }
    if (theme.stackFilters) {
        newStack = exports.stackFilter(newStack, theme.stackFilters, theme.filterInclusive)
    }
    if (theme.stackHighlights) {
        newStack = exports.stackHighlight(newStack, theme.stackHighlightPatterns, theme.stackHighlights,
            theme.highlightInclusive);
    }
    if (theme.messageLineHighlights) {
        newStack = exports.highlightStackMessage(newStack, theme.messageLineHighlights);
    }
    return newStack;
};

/**
 * Highlight just the first line of an error stack - i.e. the message part
 *
 * @param stack an Error stack
 * @param highlights an array of prefixes to be applied to each matching line (e.g. [exports.styles.RED,
 * exports.styles.BOLD])
 * @return a new error stack with the given highlights applied to the message part
 */
exports.highlightStackMessage = function (stack, highlights) {
    if (!highlights) {
        return stack;
    }
    var newStack = "";
    var lines = stack.split('\n');
    var messagePrefix = "";
    for (var i = 0; i < highlights.length; i++) {
        messagePrefix += highlights[i];
    }
    for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (isMessageLine(line, i)) {
            line = messagePrefix + line + exports.STYLES.NORMAL;
        }
        newStack += line;
        if (i < lines.length - 1) {
            newStack += '\n';
        }
    }

    return newStack;
};

/**
 * Given an stack from an Error return a subset of the lines in the stack. The first line (aka the message) is always
 * included.
 *
 * @param stack the Error stack
 * @param start the first line of the stack to include in the range. Note that the message lines are always included
 * as the real first lines regardless of the value of 'start'.
 * @param depthFromStart optional number of lines from 'start' to include in the returned stack. If not provided the full
 * stack depth starting from 'start' is provided.
 * @return a new error stack containing the specified range of lines from the provided stack.
 */
exports.stackRange = function (stack, start, depthFromStart) {
    var origLines = stack.split('\n');
    var newStack = "";

    for (var i = 0; i < origLines.length && isMessageLine(origLines[i]); i++) {
        newStack += origLines[i] + "\n";
    }

    var end = depthFromStart ? i + start + depthFromStart : origLines.length;

    for (i += start; i < origLines.length && i < end; i++) {
        newStack += origLines[i];
        if (i < origLines.length - 1 && i < end - 1) {
            newStack += "\n";
        }
    }

    return newStack;
};

/**
 * Filter lines of a stack in or out of the stack based on an array of regexp values. If a line matches a regexp then
 * it is either included or excluded in the returned stack based on the value of 'inclusive'.
 *
 * @param stack a stack from an Error
 * @param filters an array of regular expressions against which to perform match operations on each line of the
 * stack
 * @param inclusive use the filters to include or exclude from the stack. Defaults to true.
 * @return a new error stack filtered according to the 'filters' and 'inclusive' values
 */
exports.stackFilter = function (stack, filters, inclusive) {
    var includedAction = function (newStack, includedLine) {
        return newStack + includedLine;
    };
    var excludedAction = function (newStack) {
        return newStack;
    };

    return exports.applyFilters(includedAction, excludedAction, stack, filters, inclusive, false)
};

/**
 * Apply highlights to an error stack including the message part (line 0 of error.stack) based on matching patterns.
 *
 * @param stack a stack from an Error
 * @param patterns an array of regular expressions against which to perform match operations on each line of the stack
 * @param highlights an array of prefixes to be applied to each matching line (e.g. [exports.styles.RED,
 * exports.styles.BOLD])
 * @param inclusive use the patterns to include or exclude from the stack. Defaults to true.
 * @return a new error stack highlighted with the specified highlights according to the provided patterns
 */
exports.stackHighlight = function (stack, patterns, highlights, inclusive) {
    if (!highlights || highlights.length < 1) {
        return stack;
    }
    var includedAction = function (newStack, includedLine) {
        var newLine = highlights[0];
        for (var i = 1; i < highlights.length; i++) {
            newLine += highlights[i];
        }
        newLine += includedLine + exports.STYLES.NORMAL;
        return newStack + newLine;
    };

    var excludedAction = function (newStack, excludedLine) {
        return newStack + excludedLine;
    };

    return exports.applyFilters(includedAction, excludedAction, stack, patterns, inclusive, true);
};

/**
 * Apply filters to the lines of an error.stack and call the includedAction or the excludedAction functions based on
 * the result of the match and the value of the 'inclusive' parameter. If based on the filter a stack line is included
 * includedAction is invoked with the current value of the stack under construction and the current stack line. Otherwise
 * excludedAction is called with the same arguments.
 *
 * This function is common to higher level functions that operate based on stack line filtering and should only be
 * required to meet bespoke behaviour that cannot be achieved through the higher level functions (e.g.
 * exports.stackHighlight and exports.stackFilter).
 *
 * Normally there should be no need to call this function directly.
 *
 * 
 * @param includedAction the function to call for stack lines that are included based on filters and inclusive parameters.
 * Function signature is: includedAction(stackUnderConstruction, includedStackLine) returning the updated
 * stackUnderConstruction.
 * @param excludedAction the function to call for stack lines that are excluded based on filters and inclusive parameters.
 * Function signature is: excludedAction(stackUnderConstruction, excludedStackLine) returning the updated
 * stackUnderConstruction.
 * @param stack a stack from an Error
 * @param filters an array of regular expressions against which to perform match operations on each line of the
 * stack
 * @param inclusive use the filters to include or exclude from the stack. Defaults to true.
 * @param includeMessage include the message part of the stack in the filtering operation
 * @return a new error stack modified according to the results of calls to includedAction and excludedAction based on
 * filters provided and the inclusive parameter.
 */
exports.applyFilters = function (includedAction, excludedAction, stack, filters, inclusive, includeMessage) {

    var origLines = stack.split('\n');
    var newStack = "";

    if (inclusive !== true && inclusive !== false) {
        inclusive = true;
    }

    for (var i = 0; i < origLines.length; i++) {
        if (!includeMessage && isMessageLine(origLines[i])) {
            newStack += origLines[i];
        } else {
            var filter = filterMatch(origLines[i], filters);
            if ((inclusive && filter) || (!inclusive && !filter)) {
                newStack = includedAction(newStack, origLines[i]);
            } else {
                newStack = excludedAction(newStack, origLines[i]);
            }
        }

        if (i < origLines.length - 1 && newStack.charAt(newStack.length - 1) !== '\n') {
            newStack += "\n";
        }
    }

    return newStack;
};

/**
 * Determine if a provided array of regular expressions includes a match for a provided String.
 *
 * @method filterMatch
 * @private
 * @param s the String
 * @param regExps an array of reg. exp. Strings
 * @return true if a match is found; false otherwise
 */
function filterMatch(s, regExps) {
    if (!regExps) {
        return false;
    }
    var filterMatch = false;
    for (var i = 0; i < regExps.length && !filterMatch; i++) {
        filterMatch = s.match(regExps[i]) != null;
    }

    return filterMatch;
}

/**
 * Enhance an Error by adding a stackLines property that contains only the stack lines of the provided error
 * (i.e. no message lines). The stackLines property is an array of V8 CallStack objects.
 *
 * (Would have preferred to clone the given error but it seems that Object.keys(error) is always empty - so that
 * does not work.)
 *
 * @method enhanceError
 * @private
 * @param error an Error
 * @return the given error with an added stackLines property as an array of V8 CallStack objects
 */
function enhanceError(error) {
    if (!isError(error)) {
        throw new TypeError("Expected 'error' to be an Error");
    }

    error.stackLines = stackTrace.parse(error);

    return error;
}

/**
 * Determine if a given line is a line from the stack part of a stack trace (as opposed to the message part)
 *
 * @method isStackLine
 * @private
 * @param line the line String
 * @return true if the given line is deemed to be a stack line; false otherwise
 */
function isStackLine(line) {
    return line.match(/at (?:([^\s]+)\s+)?\(?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/) != null;
}

/**
 * Determine if a given line is a line from the message part of a stack trace (as opposed to the stack part).
 *
 * @method isMessageLine
 * @private
 * @param line the line String
 * @param lineNumber the line number of the given line within the stack from which it originated
 * @return true is the given line is deemed to be a stack line; false otherwise
 */
function isMessageLine(line, lineNumber) {
    return lineNumber == 0 || !isStackLine(line);
}

/**
 * Determine if a given Error has actual and expected fields.
 *
 * @method isActualExpectedError
 * @private
 * @param error the Error
 * @return true if the given Error contains values for both actual and expected
 */
function isActualExpectedError(error) {
    return error.expected != undefined && error.actual != undefined;
}

/**
 * Determine if a given parameter is an Error.
 *
 * @method isError
 * @private
 * @param error the prospective Error
 * @return true is 'error' is an Error; false otherwise
 */
function isError(error) {
    return error && (Object.prototype.toString.call(error).slice(8, -1) === "Error" ||
        (typeof error.stack !== "undefined" && typeof error.name !== "undefined"));
}

/**
 * Get the messages part of an error.stack and return these as an array. (The returned array will only contain
 * multiple items if the message part consists of multiple lines.)
 *
 * @method getMessages
 * @private
 * @param error the error whose stack messages to provide
 * @return the messages from the given error stack as an array
 */
function getMessages(error) {
    var stackLines = error.stack.split('\n');
    var messageComplete = false;
    var messageLines = [];

    for (var i = 0; i < stackLines.length && !messageComplete; i++) {
        var line = stackLines[i];
        if (isMessageLine(line, i)) {
            messageLines.push(line);
        } else {
            messageComplete = true;
        }
    }

    return messageLines;
}

/**
 * Format the stack part (i.e. the stack lines not the message part in the stack) according to a specified StackFormat.
 * (See exports.StackFormat for available stack line fields.)
 *
 * @method formatStackInternal
 * @private
 * @param error the error whose stack to format
 * @param message the message to include within the formatted stack
 * @param stackFormat the StackFormat specification
 * @return the given error with its stack modified according to the given StackFormat
 */
function formatStackInternal(error, message, stackFormat) {
    var format = stackFormat || DEFAULT_FORMAT;
    var enhanced = enhanceError(error);
    var stack = message;
    for (var i1 = 0; enhanced.stackLines && i1 < enhanced.stackLines.length; i1 += 1) {
        var stackLines = enhanced.stackLines;
        var line = format.prefix + " ";
        var typeName = null;
        var fileName = null;
        var functionName = null;
        var methodName = null;
        var lineNumber = null;
        var wrapFileDetails = false;
        for (var i2 = 0; i2 < format.components.length; i2 += 1) {
            var component = format.components[i2];
            switch (component) {
                case "typeName":
                    typeName = stackLines[i1].getTypeName();
                    if (typeName && typeName.length > 0) {
                        line += typeName;
                        wrapFileDetails = true;
                    }
                    break;
                case "functionName":
                    functionName = stackLines[i1].getFunctionName();
                    if (functionName && functionName.length > 0) {
                        if (functionName.indexOf(typeName) == 0) {
                            functionName = functionName.slice(typeName.length + 1);
                        }
                        if (typeName && typeName.length > 0) {
                            line += ".";
                        }
                        line += functionName;
                        wrapFileDetails = true;
                    }
                    break;
                case "methodName":
                    methodName = stackLines[i1].getMethodName();
                    if (methodName && methodName.length > 0 && methodName.indexOf(functionName) == -1) {
                        if (typeName && typeNmae.length > 0) {
                            line += ".";
                        }
                        line += methodName;
                        wrapFileDetails = true;
                    }
                    break;
                case "fileName":
                    fileName = stackLines[i1].getFileName();
                    if (typeName || functionName || methodName) {
                        line += " ";
                    }
                    if (fileName && fileName.length > 0) {
                        if (wrapFileDetails) {
                            line += "(";
                        }
                        line += fileName
                    }
                    break;
                case "lineNumber":
                    lineNumber = stackLines[i1].getLineNumber();
                    if (lineNumber) {
                        if (fileName) {
                            line += ":";
                        }
                        line += lineNumber;
                    }
                    break;
                case "columnNumber":
                    var columnNumber = stackLines[i1].getColumnNumber();
                    if (columnNumber) {
                        if (fileName || lineNumber) {
                            line += ":";
                        }
                        line += columnNumber;
                    }
            }
        }
        if (fileName && wrapFileDetails) {
            line += ")";
        }

        if (i1 < stackLines.length - 1) {
            line += "\n";
        }

        stack += line;
    }

    enhanced.stack = stack;

    return enhanced;
}

/**
 * Given an AssertionError that has had diffs applied - and that means it has a diff property - provide the message
 * for the AssertionError including details of the diffs.
 *
 * @method diffToMessage
 * @private
 * @param diffedAssertionError an AssertionError that has a diff property containing diffs between the expected and
 * actual values
 * @return the message that includes diff details
 */
function diffToMessage(diffedAssertionError) {
    var diff = diffedAssertionError.diff;
    var actual = "";
    var expected = "";
    for (var i = 0; i < diff.length; i++) {
        var diffType = diff[i][0];
        if (diffType === 1) {
            if (actual.length > 0) {
                actual += ", ";
            }
            actual += "\"" + diff[i][1] + "\"";
        } else if (diffType === -1) {
            if (expected.length > 0) {
                expected += ", ";
            }
            expected += "\"" + diff[i][1] + "\"";
        }
    }
    var message = "Differences: ";
    if (expected.length > 0) {
        message += "'expected': " + expected;
    }
    if (actual.length > 0) {
        if (expected.length > 0) {
            message += ", ";
        }
        message += "'actual': " + actual;
    }
    message += "\n";
    return  getMessages(diffedAssertionError).join(" ") + "\n" + message;

}


/**
 * An object that describes the format of a stack line.
 * @class StackFormat
 * @for formaterrors
 * @constructor
 */
function StackFormat() {
    this.prefix = "    at";
    this.components = ["typeName", "functionName", "methodName", "fileName", "lineNumber", "columnNumber"];
}
exports.StackFormat = StackFormat;

/**
 * An object that may be used to define a theme for a a set operations (transformations) to apply to an error stack.
 * @class StackTheme
 * @for formaterrors
 * @constructor
 */
exports.StackTheme = function () {
    this.messageLineHighlights = undefined;
    this.stackHighlights = undefined;
    this.stackHighlightPatterns = undefined;
    this.highlightInclusive = undefined;
    this.stackFilters = undefined;
    this.filterInclusive = undefined;
    this.stackRange = {
        start: undefined,
        depth: undefined
    }
};


/**
 * Some provided styles for stackHighlight. These may be overridden or alternatives may be used as required.
 * @class STYLES
 * @static
 */
exports.STYLES = {
    "RED": "\u001B[31m",
    "GREEN": "\u001B[32m",
    "YELLOW": "\u001B[33m",
    "BLUE": "\u001B[34m",
    "PURPLE": "\u001B[35m",
    "CYAN": "\u001B[36m",
    "BOLD": "\u001B[1m",
    "NORMAL": "\u001B[39m\u001B[22m"
};