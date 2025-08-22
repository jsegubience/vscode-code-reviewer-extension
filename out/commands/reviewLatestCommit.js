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
exports.reviewLatestCommit = void 0;
const vscode = __importStar(require("vscode"));
const gitUtils_1 = require("../utils/gitUtils");
const copilotProvider_1 = require("../providers/copilotProvider");
const reviewUtils_1 = require("../utils/reviewUtils");
async function reviewLatestCommit() {
    // Check if we're in a git repository
    if (!(0, gitUtils_1.checkRepositoryStatus)()) {
        vscode.window.showErrorMessage('This command requires a Git repository. Please open a folder with a Git repository.');
        return;
    }
    // Show progress indicator
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Reviewing latest commit with GitHub Copilot...",
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ increment: 20, message: "Getting latest commit..." });
            const latestCommit = await (0, gitUtils_1.getLatestCommit)();
            if (!latestCommit) {
                vscode.window.showErrorMessage('No commits found in the repository.');
                return;
            }
            progress.report({ increment: 40, message: "Analyzing code with Copilot..." });
            const copilotProvider = new copilotProvider_1.CopilotProvider();
            const reviewResult = await copilotProvider.reviewCommit(latestCommit);
            progress.report({ increment: 80, message: "Preparing results..." });
            if (reviewResult) {
                // Show summary notification
                (0, reviewUtils_1.showReviewSummary)(reviewResult);
                // Display detailed results in a new document
                (0, reviewUtils_1.displayReviewResults)(reviewResult);
                progress.report({ increment: 100, message: "Review completed!" });
            }
            else {
                vscode.window.showErrorMessage('Failed to perform code review. Please check that GitHub Copilot is properly configured.');
            }
        }
        catch (error) {
            console.error('Error during code review:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Error during code review: ${errorMessage}`);
        }
    });
}
exports.reviewLatestCommit = reviewLatestCommit;
//# sourceMappingURL=reviewLatestCommit.js.map