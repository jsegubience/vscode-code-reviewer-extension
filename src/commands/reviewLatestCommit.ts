import * as vscode from 'vscode';
import { getLatestCommit, checkRepositoryStatus } from '../utils/gitUtils';
import { Commit, ReviewResult } from '../types';
import { 
    validateRepository,
    analyzeWithCopilot, 
    displayResults, 
    handleError, 
    validateReviewResult 
} from '../utils/commitReviewService';

/**
 * Main function to handle reviewing the latest commit
 */
export async function reviewLatestCommit(): Promise<void> {
    // Check if we're in a git repository
    if (!validateRepository(checkRepositoryStatus)) {
        return;
    }

    // Show progress indicator
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Reviewing latest commit with GitHub Copilot...",
        cancellable: false
    }, async (progress) => performCommitReview(progress));
}

/**
 * Performs the review of the latest commit with progress reporting
 * @param progress The progress object for reporting status
 */
async function performCommitReview(
    progress: vscode.Progress<{increment?: number; message?: string}>
): Promise<void> {
    try {
        const latestCommit = await fetchLatestCommit(progress);
        if (!latestCommit) {
            return; // Error already shown in fetchLatestCommit
        }

        const reviewResult = await analyzeWithCopilot(latestCommit, progress);
        if (!reviewResult) {
            vscode.window.showErrorMessage('Failed to perform code review. Please check that AI model is properly configured.');
            return;
        }
        
        displayResults(reviewResult, progress);
    } catch (error) {
        handleError(error, 'Error during code review');
    }
}

/**
 * Fetches the latest commit with progress reporting
 * @param progress The progress object
 * @returns The latest commit or null if not found
 */
async function fetchLatestCommit(
    progress: vscode.Progress<{increment?: number; message?: string}>
): Promise<Commit | null> {
    progress.report({ increment: 20, message: "Getting latest commit..." });
    
    const latestCommit = await getLatestCommit();
    if (!latestCommit) {
        vscode.window.showErrorMessage('No commits found in the repository.');
        return null;
    }
    
    return latestCommit;
}