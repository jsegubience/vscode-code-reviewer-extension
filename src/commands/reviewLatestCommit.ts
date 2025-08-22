import * as vscode from 'vscode';
import { getLatestCommit, checkRepositoryStatus } from '../utils/gitUtils';
import { CopilotProvider } from '../providers/copilotProvider';
import { displayReviewResults, showReviewSummary } from '../utils/reviewUtils';

export async function reviewLatestCommit(): Promise<void> {
    // Check if we're in a git repository
    if (!checkRepositoryStatus()) {
        vscode.window.showErrorMessage('This command requires a Git repository. Please open a folder with a Git repository.');
        return;
    }

    // Show progress indicator
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Reviewing latest commit with GitHub Copilot...",
        cancellable: false
    }, async (progress: vscode.Progress<{increment?: number; message?: string}>) => {
        try {
            progress.report({ increment: 20, message: "Getting latest commit..." });
            
            const latestCommit = await getLatestCommit();
            if (!latestCommit) {
                vscode.window.showErrorMessage('No commits found in the repository.');
                return;
            }

            progress.report({ increment: 40, message: "Analyzing code with Copilot..." });
            
            const copilotProvider = new CopilotProvider();
            const reviewResult = await copilotProvider.reviewCommit(latestCommit);

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
            vscode.window.showErrorMessage(`Error during code review: ${errorMessage}`);
        }
    });
}