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

    // Prompt user for commit hashes
    const commitHashesInput = await vscode.window.showInputBox({
        prompt: 'Enter the commit hashes to review (comma-separated)',
        placeHolder: 'e.g., abc123def456, HEAD~1',
        validateInput: (value: string) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter at least one valid commit hash';
            }
            return null;
        }
    });

    if (!commitHashesInput) {
        return; // User cancelled
    }

    const commitHashes = commitHashesInput.split(',').map(hash => hash.trim()).filter(hash => hash.length > 0);

    // Notify user if too many commits are selected
    if (commitHashes.length > 5) {
        const proceed = await vscode.window.showWarningMessage(
            `You have selected ${commitHashes.length} commits. Reviewing too many commits at once may exceed token limits. Proceed?`,
            { modal: true },
            'Yes',
            'No'
        );
        if (proceed !== 'Yes') {
            return;
        }
    }

    // Get the diff truncation limit from the configuration
    const config = vscode.workspace.getConfiguration('copilotCodeReview');
    const diffLimit = config.get<number>('diffTruncationLimit', 5000); // Default to 5000 characters

    for (const commitHash of commitHashes) {
        // Show progress indicator for each commit
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Reviewing commit ${commitHash.substring(0, 7)} with GitHub Copilot...`,
            cancellable: false
        }, async (progress: vscode.Progress<{increment?: number; message?: string}>) => {
            try {
                progress.report({ increment: 20, message: "Getting commit information..." });

                const commit = await getCommitByHash(commitHash);
                if (!commit) {
                    vscode.window.showErrorMessage(`Commit ${commitHash} not found.`);
                    return;
                }

                // Limit commit diff size to reduce token usage
                const limitedCommit = {
                    ...commit,
                    diff: commit.diff.slice(0, diffLimit) // Use the configurable limit
                };

                progress.report({ increment: 40, message: "Analyzing code with Copilot..." });

                const copilotProvider = new CopilotProvider();
                const reviewResult = await copilotProvider.reviewCommit(limitedCommit);

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
}