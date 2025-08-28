import * as vscode from 'vscode';
import * as fs from 'fs';
import { Commit, ReviewResult, ReviewIssue } from '../types';

export class CopilotProvider {
    private static readonly REVIEW_CATEGORIES = {
        codeQuality: 'Code Quality: Best practices, code style, and maintainability',
        bugs: 'Potential Bugs: Logic errors, edge cases, and runtime issues', 
        security: 'Security: Vulnerabilities, unsafe operations, and security best practices',
        performance: 'Performance: Inefficient algorithms, memory usage, and optimization opportunities',
        testing: 'Testing: Missing tests, test coverage, and test quality'
    };

    async reviewCommit(commit: Commit): Promise<ReviewResult | null> {
        try {
            const model = await this.getCopilotModel();
            if (!model) return null;

            const prompt = await this.buildReviewPrompt(commit);
            const response = await this.sendCopilotRequest(model, prompt);
            
            return this.parseReviewResponse(commit.hash, response);

        } catch (error) {
            return this.handleError('reviewing commit', error);
        }
    }

    private async getCopilotModel(): Promise<any | null> {
        try {
            // Check if the Language Model API is available
            if (!vscode.lm || !vscode.lm.selectChatModels) {
                vscode.window.showErrorMessage('Language Model API is not available. Please update VS Code to version 1.91.0 or later.');
                return null;
            }

            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (models.length === 0) {
                vscode.window.showErrorMessage('GitHub Copilot is not available. Please ensure Copilot is installed and authenticated.');
                return null;
            }

            return models[0];
        } catch (error) {
            vscode.window.showErrorMessage('Failed to access GitHub Copilot. Please ensure you have the GitHub Copilot extension installed and are authenticated.');
            return null;
        }
    }

    private async sendCopilotRequest(model: any, prompt: string): Promise<string> {
        try {
            const chatResponse = await model.sendRequest([
                vscode.LanguageModelChatMessage.User(prompt)
            ]);

            let response = '';
            for await (const fragment of chatResponse.text) {
                response += fragment;
            }
            return response;
        } catch (error) {
            throw new Error(`Failed to get response from Copilot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async buildReviewPrompt(commit: Commit): Promise<string> {
        const codingStandard = await this.loadCodingStandard();
        
        return `${this.getReviewInstructions()}

${this.formatCommitInfo(commit)}

${this.formatCodingStandard(codingStandard)}

${this.getResponseFormat()}`;
    }
    private async loadCodingStandard(): Promise<string> {
        const config = vscode.workspace.getConfiguration('copilotCodeReview');
        const codingStandardPath = config.get<string>('codingStandardPath', '');

        if (!codingStandardPath) return '';

        try {
            return fs.readFileSync(codingStandardPath, 'utf-8');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showWarningMessage(`Optional coding standard file could not be read: ${errorMessage}`);
            return '';
        }
    }

    private getReviewInstructions(): string {
        return `Please perform a comprehensive code review of this Git commit. For each area below, identify specific issues AND provide concrete fixes:

${Object.entries(CopilotProvider.REVIEW_CATEGORIES)
    .map(([key, description], index) => `${index + 1}. **${description}**`)
    .join('\n')}`;
    }

    private formatCommitInfo(commit: Commit): string {
        return `**Commit Information:**
- Hash: ${commit.hash}
- Author: ${commit.author}
- Date: ${commit.date.toISOString()}
- Message: ${commit.message}

**Files Changed:**
${commit.files.join('\n')}

**Diff:**
\`\`\`
${commit.diff}
\`\`\``;
    }

    private formatCodingStandard(codingStandard: string): string {
        return codingStandard 
            ? `**Custom Coding Standard:**\n${codingStandard}\n`
            : 'No specific coding standard is being enforced for this review.';
    }

    private getResponseFormat(): string {
        return `Please provide your review in the following JSON format with SPECIFIC, ACTIONABLE fixes:
{
  "summary": "Brief overview of the changes and overall assessment",
  "overallRating": "good|needs-improvement|major-issues",
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "bug|security|performance|style|maintainability",
      "description": "Detailed description of the issue",
      "suggestedFix": "Specific code change or action to fix this issue",
      "file": "filename if applicable",
      "line": "line number if applicable"
    }
  ],
  "suggestions": [
    "Specific actionable improvements with example code when possible"
  ]
}`;
    }

    private handleError(operation: string, error: unknown): null {
        console.error(`Error ${operation} with Copilot:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to ${operation}: ${errorMessage}`);
        return null;
    }

    private parseReviewResponse(commitHash: string, response: string): ReviewResult {
        try {
            const parsed = this.extractJsonFromResponse(response);
            if (parsed) {
                return this.createReviewResult(commitHash, parsed);
            }
            
            // Fallback for non-JSON responses
            return this.createFallbackResult(commitHash, response);
            
        } catch (error) {
            console.error('Error parsing review response:', error);
            return this.createFallbackResult(commitHash, response);
        }
    }

    private extractJsonFromResponse(response: string): any | null {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    private createReviewResult(commitHash: string, parsed: any): ReviewResult {
        return {
            commitHash,
            summary: parsed.summary || 'Review completed',
            overallRating: parsed.overallRating || 'good',
            issues: parsed.issues || [],
            suggestions: parsed.suggestions || []
        };
    }

    private createFallbackResult(commitHash: string, response: string): ReviewResult {
        return {
            commitHash,
            summary: response.length > 200 ? response.substring(0, 200) + '...' : response,
            overallRating: 'needs-improvement',
            issues: [],
            suggestions: [response]
        };
    }
}