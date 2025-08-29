import * as vscode from 'vscode';
import { ReviewResult, ReviewIssue } from '../types';

export function displayReviewResults(reviewResult: ReviewResult): void {
    // Create a webview panel for better visual presentation
    const panel = vscode.window.createWebviewPanel(
        'codeReview',
        `Code Review - ${reviewResult.commitHash.substring(0, 7)}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Set the webview's HTML content
    panel.webview.html = generateWebviewContent(reviewResult);
}

function generateWebviewContent(reviewResult: ReviewResult): string {
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
                margin-top: 10px;
                color: white;
            }
            
            .summary {
                background: var(--vscode-textBlockQuote-background);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid var(--vscode-activityBarBadge-background);
            }
            
            .issues-section, .suggestions-section {
                margin-bottom: 40px;
            }
            
            .section-title {
                font-size: 1.2em;
                margin-bottom: 20px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--vscode-panel-border);
                color: var(--vscode-editor-foreground);
            }
            
            .issue-card {
                background: var(--vscode-editor-background);
                border-radius: 8px;
                margin-bottom: 15px;
                padding: 15px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .issue-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .issue-icon {
                font-size: 1.2em;
                margin-right: 10px;
            }
            
            .issue-type {
                font-weight: bold;
                margin-right: auto;
            }
            
            .severity-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                color: white;
            }
            
            .severity-high {
                background-color: #ff4444;
            }
            
            .severity-medium {
                background-color: #ff8800;
            }
            
            .severity-low {
                background-color: #ffbb33;
            }
            
            .issue-description {
                margin-bottom: 15px;
            }
            
            .suggested-fix {
                background: var(--vscode-textBlockQuote-background);
                padding: 10px;
                border-radius: 4px;
                margin-top: 10px;
                font-family: 'Courier New', monospace;
                white-space: pre-wrap;
            }
            
            .fix-content {
                margin-top: 5px;
                padding-left: 10px;
                border-left: 3px solid var(--vscode-activityBarBadge-background);
            }
            
            .issue-location {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
                margin-top: 10px;
            }
            
            .suggestion-item {
                display: flex;
                margin-bottom: 10px;
                padding: 10px;
                background: var(--vscode-editor-background);
                border-radius: 4px;
            }
            
            .suggestion-number {
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                width: 24px;
                height: 24px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                flex-shrink: 0;
            }
            
            .suggestion-text {
                line-height: 1.5;
            }

            .no-issues {
                padding: 15px;
                background: var(--vscode-editor-background);
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            }

            @media (prefers-color-scheme: dark) {
                .issue-card {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .suggestion-item {
                    background: rgba(255, 255, 255, 0.05);
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Code Review for Commit</h1>
            <div><span class="commit-hash">${reviewResult.commitHash}</span></div>
            <div class="rating" style="background-color: ${ratingColors[reviewResult.overallRating]}">
                ${formatRating(reviewResult.overallRating)}
            </div>
        </div>
        
        <div class="summary">
            <h2>Summary</h2>
            <p>${reviewResult.summary}</p>
        </div>
        
        <div class="issues-section">
            <h2 class="section-title">Issues (${reviewResult.issues.length})</h2>
            ${reviewResult.issues.length > 0 ? issuesHtml : '<div class="no-issues">No issues found in this commit. Good job!</div>'}
        </div>
        
        <div class="suggestions-section">
            <h2 class="section-title">Suggestions (${reviewResult.suggestions.length})</h2>
            ${reviewResult.suggestions.length > 0 ? suggestionsHtml : '<div class="no-issues">No suggestions for this commit.</div>'}
        </div>
    </body>
    </html>`;
}

export function showReviewSummary(reviewResult: ReviewResult): void {
    // Determine the message type based on rating
    let messageType: 'info' | 'warning' | 'error' = 'info';
    
    switch (reviewResult.overallRating) {
        case 'good':
            messageType = 'info';
            break;
        case 'needs-improvement':
            messageType = 'warning';
            break;
        case 'major-issues':
            messageType = 'error';
            break;
    }

    // Construct the message
    const issueCount = reviewResult.issues.length;
    const issueText = issueCount === 1 ? 'issue' : 'issues';
    
    const message = `${formatRating(reviewResult.overallRating)} - Found ${issueCount} ${issueText}.`;
    
    // Show the appropriate notification type
    switch (messageType) {
        case 'info':
            vscode.window.showInformationMessage(message, 'Show Details').then(selection => {
                if (selection === 'Show Details') {
                    displayReviewResults(reviewResult);
                }
            });
            break;
        case 'warning':
            vscode.window.showWarningMessage(message, 'Show Details').then(selection => {
                if (selection === 'Show Details') {
                    displayReviewResults(reviewResult);
                }
            });
            break;
        case 'error':
            vscode.window.showErrorMessage(message, 'Show Details').then(selection => {
                if (selection === 'Show Details') {
                    displayReviewResults(reviewResult);
                }
            });
            break;
    }
}

function formatRating(rating: string): string {
    return rating.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
