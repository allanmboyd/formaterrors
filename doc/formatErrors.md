# formatErrors
`require("./formatErrors");`

An API that provides various options for formatting and highlighting Errors. May be useful for logging and test
frameworks for example.
* Stack lines can be filtered in and out based on patterns and limited by range (e.g. lines 2 through 10). Stack lines
and error message can have highlights applied based on patterns. Finally stack lines can be formatted to include or
exclude available fields.
* The API is quite flexible with a range of methods varying in level with means to specify custom highlights and
formats.
@module formaterrors
@class formaterrors
@requires diffMatchPatch, stack-trace

## Functions

- - -
### StackTheme ()
Determine if a provided array of regular expressions includes a match for a provided String.
*


- - -
### applyFilters (includedAction, excludedAction, stack, filters, inclusive, includeMessage)
Apply filters to the lines of an error.stack and call the includedAction or the excludedAction functions based on
the result of the match and the value of the 'inclusive' parameter. If based on the filter a stack line is included
includedAction is invoked with the current value of the stack under construction and the current stack line. Otherwise
excludedAction is called with the same arguments.
* This function is common to higher level functions that operate based on stack line filtering and should only be
required to meet bespoke behaviour that cannot be achieved through the higher level functions (e.g.
exports.stackHighlight and exports.stackFilter).
* Normally there should be no need to call this function directly.
*

* **includedAction** *(Function(stack, stackLine))* the function to call for stack lines that are included based on filters and inclusive parameters.
Function signature is: includedAction(stackUnderConstruction, includedStackLine) returning the updated
stackUnderConstruction.
* **excludedAction** *(Function(stack, stackLine))* the function to call for stack lines that are excluded based on filters and inclusive parameters.
Function signature is: excludedAction(stackUnderConstruction, excludedStackLine) returning the updated
stackUnderConstruction.
* **stack** *(String)* a stack from an Error (i.e. error.stack)
* **filters** *(String[])* an array of regular expressions against which to perform match operations on each line of the
stack
* **inclusive** *(Boolean)* use the filters to include or exclude from the stack. Defaults to true.
* **includeMessage** *(Boolean)* include the message part of the stack in the filtering operation

- - -
### applyStackHighlights (stack, messageLineHighlights, stackHighlights, stackPatterns, inclusive)
Convenience method to apply a given set of highlights to a an error stack.
*

* **stack** *(String)* an Error stack (i.e. error.stack)
* **messageLineHighlights** *(String[])* an array of prefixes to be applied to the first line of the stack
(e.g. [exports.styles.RED, exports.styles.BOLD])
* **stackHighlights** *(String[])* an array of prefixes to be applied to each line (e.g. [exports.styles.RED,
exports.styles.BOLD]) matching one or more of the provided "stackPatterns"
* **stackPatterns** *(String[])* an array of regular expressions against which to perform match operations on each line of the stack
* **inclusive** *(Boolean)* use the patterns to include or exclude from the stack. Defaults to true.

- - -
### applyStackTheme (stack, theme)
Convenience method to apply multiple transformations to an error stack.
*

* **stack** *(String)* an error stack (i.e. error.stack)
* **theme** *(StackTheme)* the theme for the stack

- - -
### boldMessageBoldModuleStack (stack, moduleName)
Convenience method that highlights the message line and all module related lines in bold.
*

* **stack** *(String)* an Error stack (i.e. error.stack)
* **moduleName** *(String)* the name of a module whose stack lines to highlight in bold

- - -
### formatStack (error, stackFormat)
Format the stack part (i.e. the stack lines not the message part in the stack) according to a specified StackFormat.
(See exports.StackFormat for available stack line fields.)
*

* **error** *(Error)* the error whose stack to format
* **stackFormat** *(StackFormat)* the specification for the required format

- - -
### highlightAssertionError (assertionError, stackTheme)

* **assertionError** *(AssertionError)* an AssertionError
* **stackTheme** *(StackTheme)* the theme for the error

- - -
### highlightStackMessage (stack, highlights)
Highlight just the first line of an error stack - i.e. the message part
*

* **stack** *(String)* an Error stack (i.e. error.stack)
* **highlights** *(String[])* an array of prefixes to be applied to each matching line (e.g. [exports.styles.RED,
exports.styles.BOLD])

- - -
### stackFilter (stack, filters, inclusive)
Filter lines of a stack in or out of the stack based on an array of regexp values. If a line matches a regexp then
it is either included or excluded in the returned stack based on the value of 'inclusive'.
*

* **stack** *(String)* a stack from an Error (i.e. error.stack)
* **filters** *(String[])* an array of regular expressions against which to perform match operations on each line of the
stack
* **inclusive** *(Boolean)* use the filters to include or exclude from the stack. Defaults to true.

- - -
### stackHighlight (stack, patterns, highlights, inclusive)
Apply highlights to an error stack including the message part (line 0 of error.stack) based on matching patterns.
*

* **stack** *(String)* a stack from an Error (i.e. error.stack)
* **patterns** *(String[])* an array of regular expressions against which to perform match operations on each line of the stack
* **highlights** an array of prefixes to be applied to each matching line (e.g. [exports.styles.RED,
exports.styles.BOLD])
* **inclusive** *(Boolean)* use the patterns to include or exclude from the stack. Defaults to true.

- - -
### stackRange (stack, start, depthFromStart)
Given an stack from an Error return a subset of the lines in the stack. The first line (aka the message) is always
included.
*

* **stack** *(String)* the Error stack (i.e. error.stack)
* **start** *(Number)* the first line of the stack to include in the range. Note that the message lines are always included
as the real first lines regardless of the value of 'start'.
* **depthFromStart** *(Number)* optional number of lines from 'start' to include in the returned stack. If not provided the full
stack depth starting from 'start' is provided.

##Variables

- - -
### STYLES 
Some provided styles for stackHighlight. These may be overridden or alternatives may be used as required.

- - -
### StackFormat 


