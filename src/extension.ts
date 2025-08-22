import * as vscode from 'vscode';
import { reviewLatestCommit } from './commands/reviewLatestCommit';
import { reviewSpecificCommit } from './commands/reviewSpecificCommit';

export function activate(context: vscode.ExtensionContext) {
    const reviewLatestCommand = vscode.commands.registerCommand('extension.reviewLatestCommit', reviewLatestCommit);
    const reviewSpecificCommand = vscode.commands.registerCommand('extension.reviewSpecificCommit', reviewSpecificCommit);

    context.subscriptions.push(reviewLatestCommand);
    context.subscriptions.push(reviewSpecificCommand);
}

export function deactivate() {}