import * as vscode from 'vscode';
import { getCommitByHash, checkRepositoryStatus } from '../utils/gitUtils';
import { CopilotProvider } from '../providers/copilotProvider';
import { displayReviewResults, showReviewSummary } from '../utils/reviewUtils';

export async function reviewSpecificCommit(): Promise<void> {
    // Check if we're in a git repository
    if (!checkRepositoryStatus()) {
        vscode.window.showErrorMessage('This command requires a Git repository. Please open a folder with a Git repository.');
        return;
    }

    // Prompt user for commit hash
    const commitHash = await vscode.window.showInputBox({
        prompt: 'Enter the commit hash to review',
        placeHolder: 'e.g., abc123def456 or HEAD~1',
        validateInput: (value: string) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter a valid commit hash';
            }
            return null;
        }
    });

    if (!commitHash) {
        return; // User cancelled
    }

    // Show progress indicator
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Reviewing commit ${commitHash.substring(0, 7)} with GitHub Copilot...`,
        cancellable: false
    }, async (progress: vscode.Progress<{increment?: number; message?: string}>) => {
        try {
            progress.report({ increment: 20, message: "Getting commit information..." });
            
            const commit = await getCommitByHash(commitHash.trim());
            if (!commit) {
                vscode.window.showErrorMessage(`Commit ${commitHash} not found.`);
                return;
            }

            progress.report({ increment: 40, message: "Analyzing code with Copilot..." });
            
            const copilotProvider = new CopilotProvider();
            const reviewResult = await copilotProvider.reviewCommit(commit);

            progress.report({ increment: 80, message: "Preparing results..." });

            if (reviewResult) {
                // Show summary notification
                showReviewSummary(reviewResult);
                
                // Display detailed results in a new document
                displayReviewResults(reviewResult);
                
                progress.report({ increment: 100, message: "Review completed!" });
            } else {
                vscode.window.showErrorMessage('Failed to perform code review. Please check that GitHub Copilot is properly configured.');
            }
        } catch (error) {
            console.error('Error during code review:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Error reviewing commit: ${errorMessage}`);
        }
    });
}