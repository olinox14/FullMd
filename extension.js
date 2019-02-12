// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
 
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const italicSymbol = '*';
	const cleverUnlink = true;  // allows to unlink a [title](url) with ctrl+l; the url is written to the clipboard
	const autoPasteLinks = true; // an url found the clipboard is automatically pasted when a word is formatted with ctrl+l
	const autoRef = true; // Move the url at the bottom of the document when numeric link reference formatting is applied

	// return the current text editor
	function editor() { return vscode.window.activeTextEditor }
	// return the current selection
	function selection() { return editor().selection }
	// return the current selected text
	function selectedText() { return editor().document.getText(selection()) }
	// return the current position of the cursor
	function position() { return selection().active }
	// set a new position for the cursor
	function setPosition(l, c) {
		var newPosition = position().with(l, c);
        var newSelection = new vscode.Selection(newPosition, newPosition);
		editor().selection = newSelection;
		return newPosition;
	}
	// move the current position for the cursor
	function movePosition(dl, dc) {
		var pos = position();
		return setPosition(Math.max(pos.line+dl, 0), Math.max(pos.character+dc, 0));
	}

	function extendedSelection(pattern) {
		var range = editor().document.getWordRangeAtPosition(selection().active, pattern);
		return range == null ? null : new vscode.Selection(range.start, range.end);
	}

	function extendSelection(pattern) {
		var newSel = extendedSelection(pattern);
		if (newSel) {
			editor().selection = newSel; 
		}
	}

	function extendSelectionIfNone(pattern) {
		if (selection().isEmpty) {
			return extendSelection(pattern);
		}
		return selection();
	}

	// return the text with special characters regex escaped 
	function reEscape(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	// return the text with special characters markdown escaped
	function mdEscape(text) {
		return text.replace(/[-[\]{}()*+.\\#`_!]/g, '\\$&');
	}

	// ctrl+enter
	function addLinebreak() {
		editor().edit((edit) => {
			edit.insert(selection().end, '  \n');
		} )
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.addLinebreak', addLinebreak));

	// ctrl+/
	// auto-escape on formatted text?
	function escape() {
		return editor().edit(edit => edit.replace(selection(), (() => mdEscape(selectedText()))()));
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.escape', escape));

	// ctrl+h
	function headerUp() {
		var line = editor().document.lineAt(position().line);
		if (!line.text.startsWith('#####')){
			editor().edit((edit) => {
				return edit.insert(new vscode.Position(position().line, 0), (line.text.startsWith('#') ? '#' : '# '));
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerUp', headerUp));

	// ctrl+shift+h
	function headerDown() {
		var line = editor().document.lineAt(position().line);
		if (line.text.startsWith('#')){
			editor().edit((edit) => {
				return edit.delete(new vscode.Range(new vscode.Position(position().line, 0), 
								                    new vscode.Position(position().line, (line.text.startsWith('# ') ? 2 : 1))));
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerDown', headerDown));
	
	function setHeader(level) {
		var line = editor().document.lineAt(position().line);
		editor().edit((edit) => {
			return edit.replace(new vscode.Range(new vscode.Position(position().line, 0), 
												 new vscode.Position(position().line, 
												                     line.text.search(/[^\s#]/))), 
								'#'.repeat(level) + ' ');
		});
	}

	// ctrl+shift+1
	function setH1() {
		setHeader(1);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH1', setH1));
	
	// ctrl+shift+2
	function setH2() {
		setHeader(2);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH2', setH2));
	
	// ctrl+shift+3
	function setH3() {
		setHeader(3);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH3', setH3));
	
	// ctrl+shift+4
	function setH4() {
		setHeader(4);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH4', setH4));
	
	// ctrl+shift+5
	function setH5() {
		setHeader(5);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH5', setH5));
	
	// ctrl+i
	function toggleItalic() {
		// permettre de choisir le symbole dans les params
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\*(\S*)\*/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^\*(\S*)\*$/)
        if (match) {
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 1);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '*' + wordText + '*');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 2);
			}
			else {
				setPosition(position().line, position().character + 1);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleItalic', toggleItalic));
	
	// ctrl+b
	function toggleBold() {
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\*\*(\S*)\*\*/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^\*\*(\S*)\*\*$/)
        if (match) {
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 2);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '**' + wordText + '**');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 4);
			}
			else {
				setPosition(position().line, position().character + 2);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBold', toggleBold));
	
	// ctrl+alt+s
	function toggleStrikethrough() {
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /~~(\S*)~~/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^~~(\S*)~~$/)
        if (match) {
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 2);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '~~' + wordText + '~~');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 4);
			}
			else {
				setPosition(position().line, position().character + 2);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleStrikethrough', toggleStrikethrough));
	
	// ctrl+l
	const srx_url = "((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[\\-;:&=\\+\\$,\w]+@)?[A-Za-z0-9\\.\\-]+|(?:www\\.|[\\-;:&=\\+\\$,\w]+@)[A-Za-z0-9\\.\\-]+)((?:\\/[\\+~%\\/\\.\\w\\-_]*)?\\??(?:[\\-\\+=&;%@\\.\w_]*)#?(?:[\\.\\!\\/\\\\\\w]*))?)";
	function toggleLink() {

		// # Patterns and behaviours :
		// > (% is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => do nothing
		// B. [abc]() => abc%  // abc can be an empty string
		// C. [](url) => <url>%
		// D. <url> => url%
		// E. url => [%](url)
		// F1. abc => [abc](%)     // if none url in the clipboard; abc can be an empty string
		// F2. abc => [abc](url)%  // if an url was found in the clipboard; abc can be an empty string

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /<(.+)>/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\[(.*)\]/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), new RegExp('^' + srx_url + '$'));
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\S*/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return selection();
		}

		var word = getWordRange()
		var wordText = editor().document.getText(word);
		var match;

		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (cleverUnlink) {
				vscode.env.clipboard.writeText(match[2]).then();
				editor().edit((edit) => {
					return edit.replace(word, match[1]);
				} )
				setPosition(position().line, word.start.character + match[1].length + 1);
				return
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, word.end.character - 1)
			return
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			editor().edit((edit) => {
				return edit.replace(word, '<' + match[1] + '>');
			} )
			setPosition(position().line, word.end.character)
			return
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// url already <url> formatted, remove the <>
			editor().edit((edit) => {
				return edit.replace(word, match[1])
			} )
			setPosition(position().line, word.end.character)
			return
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url , apply the [](url) format
			editor().edit((edit) => {
				return edit.replace(word, '[]('+wordText+')');
			} )
			setPosition(position().line, word.start.character + 1)
			return
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		editor().edit((edit) => {
			return edit.replace(word, '['+wordText+']()');
		} )
		setPosition(position().line, word.end.character + 3);

		if (autoPasteLinks) {
			vscode.env.clipboard.readText().then((content)=>{
				content = content.trim();
				if (content.match(new RegExp('^' + srx_url + '$'))) {
					editor().edit((edit) => {
						return edit.insert(position(), content);
					} )
					setPosition(position().line, word.end.character + content.length + 4);
					vscode.env.clipboard.writeText('').then();
				}
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleLink', toggleLink));
	
	// ctrl+num
	function toggleNumRefLink(num) {
		// # Patterns and behaviours :
		// > (% is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => [abc][n]   (...)   [n]: url
		// B. [abc]() => [abc][n]
		// C. abc => [abc][n]
		// D. url => [][n] (...)  [n]: url
		// E1. [abc][n] => [abc](url) // if url is found at the bottom of the document under pattern '[n]: url'
		// E2. [abc][n] => [abc]() // if none url was found
		// > If the reference is automatically created (cases A and D): notify
		// > If the reference already exists: interrupt and notify

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /<(.+)>/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\[(.*)\]/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), new RegExp('^' + srx_url + '$'));
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		function retrieveUrl() {
			// attempt to retrieve a referenced url at the bottom of the document for the current number
			// return an empty string if none were found
			var rx;
			var linetext;
			var urlmatch;
			for (var i = 1; i <= 9; i++) {
				rx = new RegExp('\\[' + num + '\\]:\\s?(.+)');
				linetext = editor().document.lineAt(editor().document.lineCount - i).text;
				urlmatch = linetext.match(rx);
				if (urlmatch) {
					return urlmatch[1];
				}
			}
			return '';
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match;
		var url;
		
		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[2]) {
						editor().edit((edit) => {
							return edit.replace(word, '[' + match[1] + '][' + num + ']');
						} )
						setPosition(word.start.line, word.start.character + 1)
						return
					}
					else {
						vscode.window.showErrorMessage('Another url is already referenced at [' + num + ']');
						return;
					}
				}
				editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(new vscode.Position(editor().document.lineCount, 0), '\n[' + num + ']: ' + match[2]);
				} )
				setPosition(word.end.line, word.end.character - match[2].length)
				return
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					editor().edit((edit) => {
						return edit.replace(word, '[' + match[1] + '][' + num + ']');
					} )
					setPosition(word.start.line, word.start.character + 1)
					return
				}
				var end_pos = new vscode.Position(editor().document.lineCount, 0)
				editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ');
				} )
				setPosition(end_pos.line + 1, 5)
				return
			}
			else {
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + '][' + num + ']');
				} )
				setPosition(position().line, word.end.character - 1)
				return
			}
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[1]) {
						editor().edit((edit) => {
							return edit.replace(word, '[][' + num + ']');
						} )
						setPosition(word.start.line, word.start.character + 1)
						return
					}
					else {
						vscode.window.showErrorMessage('A different url is already referenced at [' + num + ']');
						return;
					}
				}
			
				var end_pos = new vscode.Position(editor().document.lineCount, 0)
				editor().edit((edit) => {
					edit.replace(word, '[][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ' + match[1]);
				} )
				setPosition(word.start.line, word.start.character + 1)
				return
			}
			else {
				return
			}
		}

		match = wordText.match(/^\[(.*)\]\[\d\]$/);
		if (match) {
			// [][ref] pattern, where ref is a one-digit number
			if (autoRef) {
				url = retrieveUrl();
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + '](' + url + ')');
				} )
				setPosition(word.end.line, word.end.character + url.length)
				return
			}
			else {
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + ']()');
				} )
				return
			}
		}

		match = wordText.match(/^\[\]\[(.+)\]$/);
		if (match) {
			// [][ref] pattern, where ref is not a one-digit number
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// <url> pattern
			return
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url
			return
		}

		// non-url formatted word: apply the [title][num] format, with word as title
		editor().edit((edit) => {
			return edit.replace(word, '['+wordText+'][' + num + ']');
		} )
		setPosition(position().line, word.end.character + 3);

		if (autoPasteLinks) {
		}

	}
	
	// ctrl+1
	function toggleNumRefLink1() { toggleNumRefLink(1); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink1', toggleNumRefLink1));
	// ctrl+2
	function toggleNumRefLink2() { toggleNumRefLink(2); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink2', toggleNumRefLink2));
	// ctrl+3
	function toggleNumRefLink3() { toggleNumRefLink(3); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink3', toggleNumRefLink3));
	// ctrl+4
	function toggleNumRefLink4() { toggleNumRefLink(4); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink4', toggleNumRefLink4));
	// ctrl+5
	function toggleNumRefLink5() { toggleNumRefLink(5); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink5', toggleNumRefLink5));
	// ctrl+6
	function toggleNumRefLink6() { toggleNumRefLink(6); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink6', toggleNumRefLink6));
	// ctrl+7
	function toggleNumRefLink7() { toggleNumRefLink(7); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink7', toggleNumRefLink7));
	// ctrl+8
	function toggleNumRefLink8() { toggleNumRefLink(8); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink8', toggleNumRefLink8));
	// ctrl+9
	function toggleNumRefLink9() { toggleNumRefLink(9); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink9', toggleNumRefLink9));

	// ctrl+g
	function toggleImageLink() {
		vscode.window.showInformationMessage('img-link');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleImageLink', toggleImageLink));
	
	// ctrl+q
	function toggleBlockquote() {
		vscode.window.showInformationMessage('quote');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBlockquote', toggleBlockquote));
	
	// ctrl+r
	function insertHRule() {
		vscode.window.showInformationMessage('hrule');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertHRule', insertHRule));
	
	// ctrl+k
	function toggleCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleCodeblock', toggleCodeblock));
	
	// none
	function togglePyCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.togglePyCodeblock', togglePyCodeblock));
	
	// none
	function toggleJsCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleJsCodeblock', toggleJsCodeblock));
	
	/// ctrl+u
	function toggleUList() {
		vscode.window.showInformationMessage('list');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleUList', toggleUList));
	
	// ctrl+o
	function toggleOList() {
		vscode.window.showInformationMessage('num-list');
	}	
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleOList', toggleOList));
	
	// ctrl++
	function toggleChecklist() {
		vscode.window.showInformationMessage('checklist');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleChecklist', toggleChecklist));

	// alt+c
	function check() {
		vscode.window.showInformationMessage('check');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.check', check));

	// ctrl+t
	function insertTable() {
		vscode.window.showInformationMessage('table');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertTable', insertTable));
	
	// ctrl+right
	function tableAddCol() {
		vscode.window.showInformationMessage('add-col');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.tableAddCol', tableAddCol));
	
	// ctrl+bottom
	function tableAddRow() {
		vscode.window.showInformationMessage('add-row');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.tableAddRow', tableAddRow));

	// ctrl+alt+p
	function togglePreview() {
		vscode.window.showInformationMessage('preview');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.togglePreview', togglePreview));
	
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
