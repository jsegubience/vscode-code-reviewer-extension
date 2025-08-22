import { execSync } from 'child_process';
import * as vscode from 'vscode';
import { Commit } from '../types';

export async function getLatestCommit(): Promise<Commit | null> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return null;
        }

        const cwd = workspaceFolder.uri.fsPath;
        
        // Get latest commit info
        const commitHash = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
        const commitInfo = execSync('git log -1 --pretty=format:"%an|%ad|%s" HEAD', { cwd, encoding: 'utf8' }).trim();
        const [author, date, message] = commitInfo.split('|');
        
        // Get diff for the latest commit
        const diff = execSync('git show --pretty="" --name-only HEAD', { cwd, encoding: 'utf8' }).trim();
        const fullDiff = execSync('git show HEAD', { cwd, encoding: 'utf8' });
        
        const files = diff.split('\n').filter((file: string) => file.trim() !== '');

        return {
            hash: commitHash,
            author,
            date: new Date(date),
            message,
            diff: fullDiff,
            files
        };
    } catch (error) {
        console.error('Error getting latest commit:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error getting latest commit: ${errorMessage}`);
        return null;
    }
}

export async function getCommitByHash(commitHash: string): Promise<Commit | null> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return null;
        }

        const cwd = workspaceFolder.uri.fsPath;
        
        // Validate commit hash exists
        try {
            execSync(`git cat-file -e ${commitHash}`, { cwd });
        } catch {
            vscode.window.showErrorMessage(`Commit ${commitHash} not found`);
            return null;
        }
        
        // Get commit info
        const commitInfo = execSync(`git log -1 --pretty=format:"%an|%ad|%s" ${commitHash}`, { cwd, encoding: 'utf8' }).trim();
        const [author, date, message] = commitInfo.split('|');
        
        // Get diff for the specific commit
        const diff = execSync(`git show --pretty="" --name-only ${commitHash}`, { cwd, encoding: 'utf8' }).trim();
        const fullDiff = execSync(`git show ${commitHash}`, { cwd, encoding: 'utf8' });
        
        const files = diff.split('\n').filter((file: string) => file.trim() !== '');

        return {
            hash: commitHash,
            author,
            date: new Date(date),
            message,
            diff: fullDiff,
            files
        };
    } catch (error) {
        console.error('Error getting commit by hash:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error getting commit ${commitHash}: ${errorMessage}`);
        return null;
    }
}

export function checkRepositoryStatus(): boolean {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }

        const cwd = workspaceFolder.uri.fsPath;
        execSync('git status', { cwd });
        return true;
    } catch (error) {
        console.error('Not a git repository:', error);
        return false;
    }
}