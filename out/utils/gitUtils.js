"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRepositoryStatus = exports.getCommitByHash = exports.getLatestCommit = void 0;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
async function getLatestCommit() {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return null;
        }
        const cwd = workspaceFolder.uri.fsPath;
        // Get latest commit info
        const commitHash = (0, child_process_1.execSync)('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
        const commitInfo = (0, child_process_1.execSync)('git log -1 --pretty=format:"%an|%ad|%s" HEAD', { cwd, encoding: 'utf8' }).trim();
        const [author, date, message] = commitInfo.split('|');
        // Get diff for the latest commit
        const diff = (0, child_process_1.execSync)('git show --pretty="" --name-only HEAD', { cwd, encoding: 'utf8' }).trim();
        const fullDiff = (0, child_process_1.execSync)('git show HEAD', { cwd, encoding: 'utf8' });
        const files = diff.split('\n').filter((file) => file.trim() !== '');
        return {
            hash: commitHash,
            author,
            date: new Date(date),
            message,
            diff: fullDiff,
            files
        };
    }
    catch (error) {
        console.error('Error getting latest commit:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error getting latest commit: ${errorMessage}`);
        return null;
    }
}
exports.getLatestCommit = getLatestCommit;
async function getCommitByHash(commitHash) {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return null;
        }
        const cwd = workspaceFolder.uri.fsPath;
        // Validate commit hash exists
        try {
            (0, child_process_1.execSync)(`git cat-file -e ${commitHash}`, { cwd });
        }
        catch {
            vscode.window.showErrorMessage(`Commit ${commitHash} not found`);
            return null;
        }
        // Get commit info
        const commitInfo = (0, child_process_1.execSync)(`git log -1 --pretty=format:"%an|%ad|%s" ${commitHash}`, { cwd, encoding: 'utf8' }).trim();
        const [author, date, message] = commitInfo.split('|');
        // Get diff for the specific commit
        const diff = (0, child_process_1.execSync)(`git show --pretty="" --name-only ${commitHash}`, { cwd, encoding: 'utf8' }).trim();
        const fullDiff = (0, child_process_1.execSync)(`git show ${commitHash}`, { cwd, encoding: 'utf8' });
        const files = diff.split('\n').filter((file) => file.trim() !== '');
        return {
            hash: commitHash,
            author,
            date: new Date(date),
            message,
            diff: fullDiff,
            files
        };
    }
    catch (error) {
        console.error('Error getting commit by hash:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error getting commit ${commitHash}: ${errorMessage}`);
        return null;
    }
}
exports.getCommitByHash = getCommitByHash;
function checkRepositoryStatus() {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }
        const cwd = workspaceFolder.uri.fsPath;
        (0, child_process_1.execSync)('git status', { cwd });
        return true;
    }
    catch (error) {
        console.error('Not a git repository:', error);
        return false;
    }
}
exports.checkRepositoryStatus = checkRepositoryStatus;
//# sourceMappingURL=gitUtils.js.map