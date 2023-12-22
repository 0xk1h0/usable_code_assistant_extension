/* TODO LIST
- Display errors when the api returns an error
- Clean up this code
*/
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import * as vscode from 'vscode';
import axios from 'axios';
import { URLSearchParams } from 'url';
import * as https from 'https';
// const vscode = require('vscode');
// const axios = require('axios');
// const https = require('https');
// const {
// 	URLSearchParams
// } = require('url');

const website = "https://seclab.co.kr";

// Accessing settings from vscode:
const activeEditor = vscode.window.activeTextEditor;
if (activeEditor){
	const currentDocument = activeEditor.document;
	const configuration = vscode.workspace.getConfiguration('', currentDocument.uri);
	const temp = Number(configuration.get('Codegen.Temperature', {}));
	const token = String(configuration.get('Codegen.Token', {}));
	const token_max_length_str = String(configuration.get('Codegen.MaxLength', {}));
	const enable_selection = Boolean(configuration.get('Codegen.EnableSelection', {}));
}
// const currentDocument = vscode.window.activeTextEditor.document;
// const configuration = vscode.workspace.getConfiguration('', currentDocument.uri);
// const temp = Number(configuration.get('Codegen.Temperature', {}));
// const token = String(configuration.get('Codegen.Token', {}));
// const token_max_length_str = String(configuration.get('Codegen.MaxLength', {}));
// const enable_selection = Boolean(configuration.get('Codegen.EnableSelection', {}));

// Converting token_max_length from string to length (128 (fast) -> 128):
// const token_max_length = parseInt(token_max_length_str);

// The comment proxy which replaces the hashtag (#)
const comment_proxy = "cgx_hashtag_comment";

async function activate(context: { subscriptions: any[]; }) {
	let selectedEditor: { edit: (arg0: (editBuilder: any) => void) => Promise<any>; selection: { end: any; }; }; //The editor to insert the completion into
	let selected_text;

	//A command to open the Codegen window
	context.subscriptions.push(vscode.commands.registerCommand('codegen.open_CodeGen', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Please open an editor to use CodeGen.');
			return;
		}

		const document = editor.document;
		// let selection;

		const cursorPosition = editor.selection.active;
		const selection = new vscode.Selection(0, 0, cursorPosition.line, cursorPosition.character);
		console.log(document.getText(selection));

		const selectedEditor = editor; //Save to be used when the completion is inserted
		const selectedRange = selection;


		var word = document.getText(selection); //The word in the selection
		word = word.replaceAll("#", comment_proxy);
		await open_CodeGen(word.trim());

	}));

	const myScheme = 'codegen';
	const textDocumentProvider = new class { //Provides a text document for the window
		async provideTextDocumentContent(uri: { query: any; }) {
			const params = new URLSearchParams(uri.query);

			if (params.get('loading') === 'true') {
				return `/* CodeGen is generating the output */\n`;
			}

			// var word = params.get('word');
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showInformationMessage('Please open an editor to use CodeGen.');
				return;
			}

			const document2 = editor.document;
			// let selection;

			const cursorPosition = editor.selection.active;
			const selection = new vscode.Selection(0, 0, cursorPosition.line, cursorPosition.character);
			
			console.log(document2.getText(selection));

			const selectedEditor = editor; //Save to be used when the completion is inserted
			const selectedRange = selection;


			var word = document2.getText(selection); //The word in the selection
			word = word.replaceAll("#", comment_proxy);			

			try {
				if (word){
					word = word.replaceAll(comment_proxy, "#");
				};
				word = word.replaceAll(comment_proxy, "#");
				console.log(word);
				const payload = { 'input': word };
				const agent = new https.Agent({  
					rejectUnauthorized: false
				  });
				// const result = await axios.post(`https://seclab.co.kr/autocompleteNLtoCode`, payload, { httpsAgent: agent });
				const result = await axios.get(`https://seclab.co.kr/autocompleteNLtoCode`,
				{
					httpsAgent : agent,
					params: {input : word},
				// 	headers: {
				// 	  'accept': 'application/json'
				// 	}, 
				  },
				);
				
				if (result.data) {

					//return getGPTText(Array(result.data.message)) + "\n" + getSOText(word);
					return getGPTText(Array(result.data));
					// return getGPTText(result.data);
				} else {
					// vscode.window.showErrorMessage(result.data.error.message);
					return result.data.error.message;
				}
			} catch (err) {
				console.log('Error sending request', err);
				return 'There was an error sending the request\n' + err;
			}
		}
	}();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, textDocumentProvider));

	//Open the CodeGen window to display the functions
	const open_CodeGen = async (word: any) => {
		//A uri to send to the document
		let loadingUri = vscode.Uri.parse(`${myScheme}:CodeGen?input=${word}`, true);
		await showUri(loadingUri); //Open a loading window
		let uri = vscode.Uri.parse(`${myScheme}:CodeGen?input=${word}`, true);
		//TODO If the uri has already been loaded, the codelense breaks
		await showUri(uri); //Show the actual content, once got from the server
	};

	const showUri = async (uri: any) => {
		const doc = await vscode.workspace.openTextDocument(uri); //Calls back into the provider
		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Beside,
			preview: true, //Don't replace the current window
			preserveFocus: true,
		});
		vscode.languages.setTextDocumentLanguage(doc, 'python'); //Enables syntax highlighting
	};

	const getGPTText = (text: any[]) => {
		codelensProvider.clearPositions();
		let content = `/* CodeGen is suggesting the following */\n`;
		let splitted_text = text;
		for (let i = 0; i < splitted_text.length; i++) {
			const lineNum = content.split('\n').length; //The line to insert the codelens on
			if (i === 0) {
				codelensProvider.addPosition(lineNum, splitted_text[i]);
			} //Add a codelens on that line
			if (i !== 0) {
				codelensProvider.addPosition(lineNum - 1, splitted_text[i]);
			}
			content += splitted_text[i]; //Display the entire function in the CodeGen window
			if (i < splitted_text.length - 1) {content += '\n\n';};
		};
		return content;
	};

	const getSOText = (text: any) => {
		//let content = `\n\n\n\n/* Stack Overflow Answers */\n\nWORK IN PROGRESS`;

		// Do stuff

		//return content;
	};

	//When the user clicks on a codelens for a function
	context.subscriptions.push(vscode.commands.registerCommand('CodeGen.chooseOption', (fn: any) => {
		if (!selectedEditor) {return;}
		try {
			selectedEditor.edit(editBuilder => {
				var s = selectedEditor.selection;

				editBuilder.replace(s, fn); //Insert the function into the text
			}).then(success => {
				var postion = selectedEditor.selection.end;
				selectedEditor.selection = new vscode.Selection(postion, postion);
			});
		} catch (e) {
			//The editor isn't open
		}
	}));

	const codelensProvider = new class {
		codelenses: any[]; //Keeps track of and provides codelenses
		constructor() {
			this.codelenses = [];
		}
		addPosition(lineNum: number, fn: any) {
			const range = new vscode.Range(lineNum, 0, lineNum, 0); //Display it on that line
			this.codelenses.push(new vscode.CodeLens(range, {
				title: 'Use code',
				command: 'CodeGen.chooseOption',
				arguments: [
					fn
				],
				tooltip: 'Insert this snippet into your code'
			}));
		}
		clearPositions() {
			this.codelenses = [];
		}

		provideCodeLenses(document: any) {
			return this.codelenses;
		}

	}();
	context.subscriptions.push(vscode.languages.registerCodeLensProvider({
		scheme: myScheme //Only adds codelens to CodeGen windows
	}, codelensProvider));
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};