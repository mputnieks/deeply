import * as vscode from 'vscode'
import ollama from 'ollama'

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, extension "deeply" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('deeply.start', () => {
		vscode.window.showInformationMessage('Hi from Deeply!');
		const panel = vscode.window.createWebviewPanel(
			'deeplyChat',
			'Chat with Deeply',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();
		panel.webview.onDidReceiveMessage( async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let response = '';

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					})
					for await (const chunk of streamResponse) {
						response += chunk.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: response });
					}
				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(error)}` });
				}

			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Chat with Deeply</title>
			<style>
				body {
					font-family: sans-serif;
					margin: 1rem;
				}
				#prompt {
					width: 100%;
					box-sizing: border-box;
				}
				#response {
					border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; white-space: pre-wrap; max-height: 200px; overflow-y: auto; min-height: 100px;
				}
			</style>
		</head>
		<body>
			<h2>Chat with Deeply</h2>
			<textarea id="prompt" rows="3" placeholder="Ask Deeply..." type="text"></textarea><br/>
			<button id="send">Send</button>
			<div id="response"></div>

			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('send').addEventListener('click', () => {
					const text = document.getElementById('prompt').value;
					vscode.postMessage({ command: 'chat', text });
				});

				window.addEventListener('message', event => {
					const {command, text} = event.data;
					if (command === 'chatResponse') {
						document.getElementById('response').innerText = text;
					}
				});
			</script>
		</body>
		</html>`;
}

// called when extension is deactivated
export function deactivate() {}