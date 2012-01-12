/**
 * Some provided styles for stackHighlight. These may be overridden or alternatives may be used as required.
 */
exports.styles = {
    "RED": "\u001B[31m",
    "GREEN": "\u001B[32m",
    "YELLOW": "\u001B[33m",
    "BLUE": "\u001B[34m",
    "PURPLE": "\u001B[35m",
    "CYAN": "\u001B[36m",
    "BOLD": "\u001B[1m",
    "NORMAL": "\u001B[39m\u001B[22m"
};

/**
 * An object that may be used to define a set of format operations (transformations) to apply to an error stack.
 */
exports.StackFormat = function () {
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

exports.formatAssertionError = function (assertionError) {

};

/**
 * Convenience function that highlights the message line and all module related lines in bold.
 *
 * @param stack an Error stack
 * @param moduleName the name of a module whose stack lines to highlight in bold
 * @return a new error stack with bold message and module entries.
 */
exports.boldMessageBoldModuleStack = function (stack, moduleName) {
    var format = new exports.StackFormat();
    format.messageLineHighlights = [exports.styles.BOLD];
    format.stackHighlights = [exports.styles.BOLD];
    format.stackHighlightPatterns = [moduleName];
    return exports.applyStackFormat(stack, format);
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
exports.applyHighlightStackFormat = function (stack, messageLineHighlights, stackHighlights, stackPatterns, inclusive) {
    var format = new exports.StackFormat();
    format.messageLineHighlights = messageLineHighlights;
    format.stackHighlights = stackHighlights;
    format.stackHighlightPatterns = stackPatterns;
    format.highlightInclusive = inclusive;
    return exports.applyStackFormat(stack, format);
};

/**
 * Convenience method to apply multiple transformations to an error stack.
 *
 * @param stack an error stack
 * @param format a StackFormat (see exports.StackFormat)
 * @return a new error stack String transformed according to the specificied StackFormat
 */
exports.applyStackFormat = function (stack, format) {
    var newStack = stack;
    if (format.stackRange.start) {
        newStack = exports.stackRange(newStack, format.stackRange.start, format.stackRange.depth);
    }
    if (format.stackFilters) {
        newStack = exports.stackFilter(newStack, format.stackFilters, format.filterInclusive)
    }
    if (format.stackHighlights) {
        newStack = exports.stackHighlight(newStack, format.stackHighlightPatterns, format.stackHighlights,
            format.highlightInclusive);
    }
    if (format.messageLineHighlights) {
        newStack = exports.highlightStackMessage(newStack, format.messageLineHighlights);
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
            line = messagePrefix + line + exports.styles.NORMAL;
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
    var newStack= "";

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
        newLine += includedLine + exports.styles.NORMAL;
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

var isStackLine = function isStackLine(line) {
    return line.length > 50 && line.indexOf("/") !== -1 && line.indexOf(".js") !== -1;
};

var isMessageLine = function isMessageLine(line, lineNumber) {
    return lineNumber == 0 || !isStackLine(line);
};
