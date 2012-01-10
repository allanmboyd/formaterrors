/**
 * Some provided styles for stackHighlight. These may be overridden or alternatives may be used as required.
 */
exports.styles = {
    "RED": "\u001B[31m",
    "GREEN": "\u001B[32m",
    "BLUE": "\u001B[33m",
    "BOLD": "\u001B[1m",
    "NORMAL": "\u001B[39m\u001B[22m"
};

/**
 * Given an stack from an Error return a subset of the lines in the stack. The first line (aka the message) is always
 * included.
 * @param stack the Error stack
 * @param start the first line of the stack to include in the range. Note that line 0 (the message) is always included
 * as the real first line regardless of the value of 'start'.
 * @param depthFromStart optional number of lines from 'start' to include in the returned stack. If not provided the full
 * stack depth starting from 'start' is provided.
 * @return a new error stack containing the specified range of lines from the provided stack.
 */
exports.stackRange = function (stack, start, depthFromStart) {
    var origLines = stack.split('\n');
    var end = depthFromStart ? start + depthFromStart : origLines.length;
    var newStack = origLines[0] + "\n";

    if (start < 1) {
        start = 1;
    }

    for (var i = start; i < origLines.length && i < end; i++) {
        newStack += origLines[i];
        if (i < origLines.length - 1) {
            newStack += "\n";
        }
    }

    return newStack;
};

/**
 * Filter lines of a stack in or out of the stack based on an array of regexp values. If a line matches a regexp then
 * it is either included or excluded in the returned stack based on the value of 'inclusive'.
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

    return exports.applyFilters(includedAction, excludedAction, stack, filters, inclusive)
};

/**
 * Apply highlights to an error stack including the message part (line 0 of error.stack) based on matching patterns.
 * @param stack a stack from an Error
 * @param patterns an array of regular expressions against which to perform match operations on each line of the stack
 * @param highlights an array of prefixes to be applied to each matching line (e.g. [exports.styles.RED,
 * exports.styles.BOLD]).
 * @return a new error stack highlighted with the specified highlights according to the provided patterns
 */
exports.stackHighlight = function (stack, patterns, highlights) {
    if(!highlights || highlights.length < 1) {
        return stack;
    }
    var includedAction = function (newStack, includedLine) {
        var newLine = highlights[0];
        for(var i=1; i<highlights.length; i++) {
            newLine += highlights[i];
        }
        newLine += includedLine + exports.styles.NORMAL;
        return newStack + newLine;
    };

    var excludedAction = function (newStack, excludedLine) {
        return newStack + excludedLine;
    };

    return exports.applyFilters(includedAction, excludedAction, stack, patterns, true, true);
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
 * @param includeMessage include line[0] of the stack in the filtering operation
 * @return a new error stack modified according to the results of calls to includedAction and excludedAction based on
 * filters provided and the inclusive parameter.
 */
exports.applyFilters = function (includedAction, excludedAction, stack, filters, inclusive, includeMessage) {

    if (!filters || filters.length < 1) {
        return stack;
    }

    var origLines = stack.split('\n');
    var startLine = 1;
    var newStack = "";
    if(includeMessage) {
        startLine = 0;
    } else {
        newStack = origLines[0] + "\n";
    }

    if (inclusive !== true && inclusive !== false) {
        inclusive = true;
    }

    for (var i = startLine; i < origLines.length; i++) {
        var filter = filterMatch(origLines[i], filters);
        if ((inclusive && filter) || (!inclusive && !filter)) {
            newStack = includedAction(newStack, origLines[i]);
        } else {
            newStack = excludedAction(newStack, origLines[i]);
        }
        if (i < origLines.length - 1 && newStack.charAt(newStack.length-1) !== '\n') {
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
    var filterMatch = false;
    for (var i = 0; i < regExps.length && !filterMatch; i++) {
        filterMatch = s.match(regExps[i]) != null;
    }

    return filterMatch;
}