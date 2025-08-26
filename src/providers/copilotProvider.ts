import * as vscode from 'vscode';
import * as fs from 'fs';
import { Commit, ReviewResult, ReviewIssue } from '../types';

export class CopilotProvider {
    async reviewCommit(commit: Commit): Promise<ReviewResult | null> {
        try {
            // Create a comprehensive prompt for Copilot
            const prompt = await this.createReviewPrompt(commit);

            // Get available language models (requires GitHub Copilot)
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (models.length === 0) {
                vscode.window.showErrorMessage('GitHub Copilot is not available. Please ensure Copilot is installed and authenticated.');
                return null;
            }

            // Send the review request to Copilot
            const chatResponse = await models[0].sendRequest([
                vscode.LanguageModelChatMessage.User(prompt)
            ]);

            let response = '';
            for await (const fragment of chatResponse.text) {
                response += fragment;
            }

            // Parse the response and create a structured review result
            return this.parseReviewResponse(commit.hash, response);

        } catch (error) {
            console.error('Error reviewing commit with Copilot:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to review commit: ${errorMessage}`);
            return null;
        }
    }

    private async createReviewPrompt(commit: Commit): Promise<string> {
        let codingStandard = '';

        // Fetch the coding standard file path from the configuration
        const config = vscode.workspace.getConfiguration('copilotCodeReview');
        const codingStandardPath = config.get<string>('codingStandardPath', '');

        // Read the coding standard file if the path is provided
        if (codingStandardPath) {
            try {
                codingStandard = fs.readFileSync(codingStandardPath, 'utf-8');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showWarningMessage(`Optional coding standard file could not be read: ${errorMessage}`);
            }
        }

        return `Please perform a comprehensive code review of this Git commit. For each area below, identify specific issues AND provide concrete fixes:

1. **Code Quality**: Best practices, code style, and maintainability
   - Identify: naming conventions, code structure, readability issues
   - Suggest: specific refactoring, better naming, architectural improvements

2. **Potential Bugs**: Logic errors, edge cases, and runtime issues
   - Identify: null pointer risks, array bounds, error handling gaps
   - Suggest: specific code changes, validation additions, error handling improvements

3. **Security**: Vulnerabilities, unsafe operations, and security best practices
   - Identify: injection risks, authentication issues, data exposure
   - Suggest: specific security measures, input validation, sanitization methods

4. **Performance**: Inefficient algorithms, memory usage, and optimization opportunities
   - Identify: slow algorithms, memory leaks, unnecessary operations
   - Suggest: specific optimizations, better algorithms, caching strategies

5. **Testing**: Missing tests, test coverage, and test quality
   - Identify: untested code paths, missing edge cases, weak assertions
   - Suggest: specific test cases to add, testing strategies, mock improvements

**Commit Information:**
- Hash: ${commit.hash}
- Author: ${commit.author}
- Date: ${commit.date.toISOString()}
- Message: ${commit.message}

**Files Changed:**
${commit.files.join('\n')}

**Diff:**
\`\`\`
${commit.diff}
\`\`\`

${codingStandard ? `**Custom Coding Standard:**\n${codingStandard}\n` : ''}

Please provide your review in the following JSON format with SPECIFIC, ACTIONABLE fixes:
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

    private parseReviewResponse(commitHash: string, response: string): ReviewResult {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                return {
                    commitHash,
                    summary: parsed.summary || 'Review completed',
                    overallRating: parsed.overallRating || 'good',
                    issues: parsed.issues || [],
                    suggestions: parsed.suggestions || []
                };
            }
            
            // Fallback if JSON parsing fails
            return {
                commitHash,
                summary: response.substring(0, 200) + '...',
                overallRating: 'needs-improvement',
                issues: [],
                suggestions: [response]
            };
            
        } catch (error) {
            console.error('Error parsing review response:', error);
            
            // Return a basic review result with the raw response
            return {
                commitHash,
                summary: 'Review completed with basic analysis',
                overallRating: 'needs-improvement',
                issues: [],
                suggestions: [response]
            };
        }
    }
}