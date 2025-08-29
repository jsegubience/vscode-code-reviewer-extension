import * as vscode from 'vscode';
import { AIReviewProvider } from '../providers/aiReviewProvider';
import { displayReviewResults, showReviewSummary } from '../utils/reviewPresentation';
import { Commit, ReviewResult } from '../types';

/**
 * Gets the diff truncation limit from configuration
 * @returns The configured diff limit
 */
export function getDiffTruncationLimit(): number {
    const config = vscode.workspace.getConfiguration('copilotCodeReview');
    return config.get<number>('diffTruncationLimit', 5000); // Default to 5000 characters
}

/**
 * Truncates a commit's diff to limit token usage
 * @param commit The commit to truncate
 * @param diffLimit The maximum number of characters for diff content
 * @returns A new commit object with truncated diff
 */
export function truncateCommitDiff(commit: Commit, diffLimit: number): Commit {
    return {
        ...commit,
        diff: commit.diff.slice(0, diffLimit)
    };
}

/**
 * Performs a code review using Copilot
 * @param commit The commit data to review
 * @param progress The progress object for reporting status
 * @returns The review result or null if failed
 */
export async function analyzeWithCopilot(
    commit: Commit,
    progress: vscode.Progress<{increment?: number; message?: string}>
): Promise<ReviewResult | null> {
    progress.report({ increment: 40, message: "Analyzing code with AI..." });
    
    const aiProvider = new AIReviewProvider();
    return await aiProvider.reviewCommit(commit);
}

/**
 * Displays the review results
 * @param reviewResult The result to display
 * @param progress The progress object
 */
export function displayResults(
    reviewResult: ReviewResult,
    progress: vscode.Progress<{increment?: number; message?: string}>
): void {
    progress.report({ increment: 80, message: "Preparing results..." });
    
    // Show summary notification
    showReviewSummary(reviewResult);
    
    // Display detailed results in a new document
    displayReviewResults(reviewResult);
    
    progress.report({ increment: 100, message: "Review completed!" });
}

/**
 * Handles any errors that occur during the review process
 * @param error The error that occurred
 * @param customMessage Optional custom message prefix
 */
export function handleError(error: unknown, customMessage: string = 'Error during code review'): void {
    console.error(`${customMessage}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`${customMessage}: ${errorMessage}`);
}

/**
 * Checks if a review result is valid and shows an error if not
 * @param reviewResult The review result to check
 * @returns True if the result is valid, false otherwise
 * @deprecated Use direct null checking instead for better type safety
 */
export function validateReviewResult(reviewResult: ReviewResult | null): boolean {
    if (!reviewResult) {
        vscode.window.showErrorMessage('Failed to perform code review. Please check that AI model is properly configured.');
        return false;
    }
    return true;
}

/**
 * Checks if the repository is valid
 * @param checkRepositoryStatus Function to check repository status
 * @returns True if valid, false otherwise
 */
export function validateRepository(checkRepositoryStatus: () => boolean): boolean {
    if (!checkRepositoryStatus()) {
        vscode.window.showErrorMessage('This command requires a Git repository. Please open a folder with a Git repository.');
        return false;
    }
    return true;
}
