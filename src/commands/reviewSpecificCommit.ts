import * as vscode from 'vscode';
import { getCommitByHash, checkRepositoryStatus } from '../utils/gitUtils';
import { Commit, ReviewResult } from '../types';
import { 
    validateRepository,
    getDiffTruncationLimit,
    truncateCommitDiff,
    analyzeWithCopilot,
    displayResults,
    handleError,
    validateReviewResult
} from '../utils/commitReviewService';

/**
 * Main function to handle reviewing specific commits
 */
export async function reviewSpecificCommit(): Promise<void> {
    // Check if we're in a git repository
    if (!validateRepository(checkRepositoryStatus)) {
        return;
    }

    const commitHashes = await promptForCommitHashes();
    if (!commitHashes) {
        return; // User cancelled or no valid hashes
    }

    if (!await validateCommitCount(commitHashes)) {
        return; // User chose not to proceed with too many commits
    }

    const diffLimit = getDiffTruncationLimit();
    await processCommits(commitHashes, diffLimit);
}

/**
 * Prompts the user to enter commit hashes
 * @returns Array of commit hashes or null if cancelled/invalid
 */
async function promptForCommitHashes(): Promise<string[] | null> {
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
        return null; // User cancelled
    }

    return commitHashesInput.split(',')
        .map(hash => hash.trim())
        .filter(hash => hash.length > 0);
}

/**
 * Validates if the number of commits is reasonable
 * @param commitHashes Array of commit hashes
 * @returns True if valid/confirmed, false otherwise
 */
async function validateCommitCount(commitHashes: string[]): Promise<boolean> {
    if (commitHashes.length <= 5) {
        return true;
    }
    
    const proceed = await vscode.window.showWarningMessage(
        `You have selected ${commitHashes.length} commits. Reviewing too many commits at once may exceed token limits. Proceed?`,
        { modal: true },
        'Yes',
        'No'
    );
    
    return proceed === 'Yes';
}

/**
 * Processes each commit for review
 * @param commitHashes Array of commit hashes to process
 * @param diffLimit The maximum number of characters for diff content
 */
async function processCommits(commitHashes: string[], diffLimit: number): Promise<void> {
    for (const commitHash of commitHashes) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Reviewing commit ${commitHash.substring(0, 7)} with GitHub Copilot...`,
            cancellable: false
        }, (progress) => reviewSingleCommit(commitHash, diffLimit, progress));
    }
}

/**
 * Reviews a single commit with progress reporting
 * @param commitHash The commit hash to review
 * @param diffLimit The maximum number of characters for diff content
 * @param progress The progress object for reporting status
 */
async function reviewSingleCommit(
    commitHash: string, 
    diffLimit: number, 
    progress: vscode.Progress<{increment?: number; message?: string}>
): Promise<void> {
    try {
        progress.report({ increment: 20, message: "Getting commit information..." });

        const commit = await getCommitByHash(commitHash);
        if (!commit) {
            vscode.window.showErrorMessage(`Commit ${commitHash} not found.`);
            return;
        }

        // Limit commit diff size to reduce token usage
        const limitedCommit = truncateCommitDiff(commit, diffLimit);

        const reviewResult = await analyzeWithCopilot(limitedCommit, progress);
        if (!reviewResult) {
            vscode.window.showErrorMessage('Failed to perform code review. Please check that AI model is properly configured.');
            return;
        }
        
        displayResults(reviewResult, progress);
    } catch (error) {
        handleError(error, `Error reviewing commit ${commitHash}`);
    }
}