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
exports.showReviewSummary = exports.formatReviewResults = exports.displayReviewResults = void 0;
const vscode = __importStar(require("vscode"));
function displayReviewResults(reviewResult) {
    // Create a webview panel for better visual presentation
    const panel = vscode.window.createWebviewPanel('codeReview', `Code Review - ${reviewResult.commitHash.substring(0, 7)}`, vscode.ViewColumn.One, {
        enableScripts: true
    });
    // Set the webview's HTML content
    panel.webview.html = generateWebviewContent(reviewResult);
}
exports.displayReviewResults = displayReviewResults;
function generateWebviewContent(reviewResult) {
    const severityColors = {
        high: '#ff4444',
        medium: '#ff8800',
        low: '#ffbb33'
    };
    const typeIcons = {
        bug: '🐛',
        security: '🔒',
        performance: '⚡',
        style: '🎨',
        maintainability: '🛠️'
    };
    const ratingColors = {
        'good': '#4CAF50',
        'needs-improvement': '#FF9800',
        'major-issues': '#F44336'
    };
    const issuesHtml = reviewResult.issues.map((issue, index) => `
        <div class="issue-card" style="border-left: 4px solid ${severityColors[issue.severity]};">
            <div class="issue-header">
                <span class="issue-icon">${typeIcons[issue.type] || '⚠️'}</span>
                <span class="issue-type">${issue.type.toUpperCase()}</span>
                <span class="severity-badge severity-${issue.severity}">${issue.severity.toUpperCase()}</span>
            </div>
            <div class="issue-description">${issue.description}</div>
            ${issue.suggestedFix ? `<div class="suggested-fix">
                <strong>💡 Suggested Fix:</strong>
                <div class="fix-content">${issue.suggestedFix}</div>
            </div>` : ''}
            ${issue.file ? `<div class="issue-location">📁 ${issue.file}${issue.line ? ` (Line ${issue.line})` : ''}</div>` : ''}
        </div>
    `).join('');
    const suggestionsHtml = reviewResult.suggestions.map((suggestion, index) => `
        <div class="suggestion-item">
            <span class="suggestion-number">${index + 1}</span>
            <span class="suggestion-text">${suggestion}</span>
        </div>
    `).join('');
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Review Results</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            
            .header {
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .commit-hash {
                font-family: 'Courier New', monospace;
                background: var(--vscode-textBlockQuote-background);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
            }
            
            .rating {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 0.8em;
                margin: 10px 0;
                color: white;
                background-color: ${ratingColors[reviewResult.overallRating]};
            }
            
            .summary {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 16px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
            }
            
            .section {
                margin: 30px 0;
            }
            
            .section-title {
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 15px;
                color: var(--vscode-textLink-foreground);
            }
            
            .issue-card {
                background: var(--vscode-editor-inactiveSelectionBackground);
                margin: 15px 0;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .issue-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .issue-icon {
                font-size: 1.2em;
            }
            
            .issue-type {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
            }
            
            .severity-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
                color: white;
            }
            
            .severity-high { background-color: #ff4444; }
            .severity-medium { background-color: #ff8800; }
            .severity-low { background-color: #ffbb33; }
            
            .issue-description {
                margin: 10px 0;
                line-height: 1.5;
            }
            
            .issue-location {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
                font-family: 'Courier New', monospace;
            }
            
            .suggested-fix {
                margin-top: 12px;
                padding: 12px;
                background: var(--vscode-textCodeBlock-background);
                border-radius: 6px;
                border-left: 3px solid var(--vscode-textLink-foreground);
            }
            
            .fix-content {
                margin-top: 8px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                line-height: 1.4;
                white-space: pre-wrap;
            }
            
            .suggestion-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin: 12px 0;
                padding: 12px;
                background: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 6px;
            }
            
            .suggestion-number {
                background: var(--vscode-textLink-foreground);
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .suggestion-text {
                flex: 1;
                line-height: 1.5;
            }
            
            .no-issues {
                text-align: center;
                padding: 40px;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border);
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔍 Code Review Results</h1>
            <div><strong>Commit:</strong> <span class="commit-hash">${reviewResult.commitHash}</span></div>
            <div class="rating">${reviewResult.overallRating.replace('-', ' ')}</div>
        </div>
        
        <div class="section">
            <div class="section-title">📋 Summary</div>
            <div class="summary">${reviewResult.summary}</div>
        </div>
        
        <div class="section">
            <div class="section-title">⚠️ Issues Found (${reviewResult.issues.length})</div>
            ${reviewResult.issues.length > 0 ? issuesHtml : '<div class="no-issues">🎉 No issues found! Great job!</div>'}
        </div>
        
        <div class="section">
            <div class="section-title">💡 Suggestions (${reviewResult.suggestions.length})</div>
            ${reviewResult.suggestions.length > 0 ? suggestionsHtml : '<div class="no-issues">No additional suggestions at this time.</div>'}
        </div>
        
        <div class="footer">
            <p>Review generated by GitHub Copilot ✨</p>
        </div>
    </body>
    </html>`;
}
function formatReviewResults(reviewResult) {
    let content = `# Code Review Results\n\n`;
    content += `**Commit:** ${reviewResult.commitHash}\n\n`;
    content += `**Overall Rating:** ${reviewResult.overallRating.toUpperCase()}\n\n`;
    content += `## Summary\n\n${reviewResult.summary}\n\n`;
    if (reviewResult.issues.length > 0) {
        content += `## Issues Found\n\n`;
        reviewResult.issues.forEach((issue, index) => {
            content += `### ${index + 1}. ${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}\n\n`;
            content += `${issue.description}\n\n`;
            if (issue.file) {
                content += `**File:** ${issue.file}`;
                if (issue.line) {
                    content += ` (Line ${issue.line})`;
                }
                content += `\n\n`;
            }
        });
    }
    if (reviewResult.suggestions.length > 0) {
        content += `## Suggestions\n\n`;
        reviewResult.suggestions.forEach((suggestion, index) => {
            content += `${index + 1}. ${suggestion}\n\n`;
        });
    }
    content += `---\n\n*Review generated by GitHub Copilot*`;
    return content;
}
exports.formatReviewResults = formatReviewResults;
function showReviewSummary(reviewResult) {
    const issueCount = reviewResult.issues.length;
    const highSeverityCount = reviewResult.issues.filter(issue => issue.severity === 'high').length;
    let message = `Review completed for commit ${reviewResult.commitHash.substring(0, 7)}. `;
    if (issueCount === 0) {
        message += 'No issues found! ✅';
        vscode.window.showInformationMessage(message);
    }
    else {
        message += `Found ${issueCount} issue(s)`;
        if (highSeverityCount > 0) {
            message += ` (${highSeverityCount} high severity)`;
        }
        if (highSeverityCount > 0) {
            vscode.window.showWarningMessage(message);
        }
        else {
            vscode.window.showInformationMessage(message);
        }
    }
}
exports.showReviewSummary = showReviewSummary;
//# sourceMappingURL=reviewUtils.js.map