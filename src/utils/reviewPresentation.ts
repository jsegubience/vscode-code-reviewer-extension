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

/**
 * Processes code content for proper HTML display
 * Helps with JSON, JavaScript, and other common formats
 */
function processCodeContent(content: string): string {
    // Safety check
    if (!content) return '';
    
    // Escape HTML to prevent injection
    let processed = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Special handling for JSON to improve readability
    if (processed.includes('{') && processed.includes('}')) {
        try {
            // Try to detect if it's valid JSON
            const jsonMatch = processed.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonPart = jsonMatch[0];
                try {
                    // Validate and format the JSON part
                    const formatted = JSON.stringify(JSON.parse(jsonPart), null, 2);
                    // Replace the JSON part with formatted version
                    processed = processed.replace(jsonPart, formatted);
                } catch (e) {
                    // Not valid JSON, leave as is
                }
            }
        } catch (e) {
            // If any error occurs, just use the original escaped content
        }
    }
    
    return processed;
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
                <div class="fix-content">${processCodeContent(issue.suggestedFix)}</div>
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
            
            /* Syntax highlighting helpers */
            .key { color: var(--vscode-symbolIcon-keywordForeground, #569cd6); }
            .string { color: var(--vscode-symbolIcon-stringForeground, #ce9178); }
            .number { color: var(--vscode-symbolIcon-numberForeground, #b5cea8); }
            .boolean { color: var(--vscode-symbolIcon-booleanForeground, #569cd6); }
            
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
                margin-bottom: 10px;
                justify-content: space-between; /* Better positioning for the badge */
            }
            
            .issue-icon {
                font-size: 1.2em;
                margin-right: 10px;
            }
            
            .issue-type {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-right: auto; /* Push badge to the right */
            }
            
            .severity-badge {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
                color: white;
                margin-left: 10px;
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
                margin: 10px 0;
                line-height: 1.5;
            }
            
            .suggested-fix {
                margin-top: 12px;
                padding: 12px;
                background: var(--vscode-textCodeBlock-background);
                border-radius: 6px;
                border-left: 3px solid var(--vscode-textLink-foreground);
            }
            
            .fix-content {
                margin-top: 12px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                line-height: 1.4;
                white-space: pre;
                overflow-x: auto;
                display: block;
                width: 100%;
                padding: 12px;
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                tab-size: 2;
            }
            
            /* Style for code blocks to ensure proper indentation and formatting */
            .fix-content {
                position: relative;
                color: var(--vscode-textPreformat-foreground, inherit);
                background-color: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.05));
            }
            
            .issue-location {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
                margin-top: 10px;
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
            <h1>🔍 Code Review Results</h1>
            <div><strong>Commit:</strong> <span class="commit-hash">${reviewResult.commitHash}</span></div>
            <div class="rating" style="background-color: ${ratingColors[reviewResult.overallRating]}">
                ${formatRating(reviewResult.overallRating)}
            </div>
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
            <p>Review generated by AI ✨</p>
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
