import * as vscode from 'vscode';
import * as fs from 'fs';
import { Commit, ReviewResult, ReviewIssue } from '../types';

export class AIReviewProvider {
    private static readonly REVIEW_CATEGORIES = {
        codeQuality: 'Code Quality: Best practices, code style, and maintainability',
        bugs: 'Potential Bugs: Logic errors, edge cases, and runtime issues', 
        security: 'Security: Vulnerabilities, unsafe operations, and security best practices',
        performance: 'Performance: Inefficient algorithms, memory usage, and optimization opportunities',
        testing: 'Testing: Missing tests, test coverage, and test quality'
    };

    async reviewCommit(commit: Commit): Promise<ReviewResult | null> {
        try {
            const model = await this.getLanguageModel();
            if (!model) return null;

            // Show which model is being used
            this.logSelectedModel(model);

            const prompt = await this.buildReviewPrompt(commit);
            const response = await this.sendModelRequest(model, prompt);
            
            return this.parseReviewResponse(commit.hash, response);

        } catch (error) {
            return this.handleError('reviewing commit', error);
        }
    }
    
    /**
     * Logs information about the selected model and shows it briefly in the status bar
     * @param model The selected language model
     */
    private logSelectedModel(model: any): void {
        const modelInfo = model.name || 'Unknown model';
        const vendorInfo = model.vendor || 'Unknown vendor';
        const modelMessage = `Using AI model: ${modelInfo} (${vendorInfo})`;
        
        console.log('Model selection details:', {
            name: model.name,
            vendor: model.vendor,
            vendorDetails: model.vendorDetails || {},
            additionalProperties: Object.keys(model)
        });
        
        // Show in status bar temporarily
        vscode.window.setStatusBarMessage(modelMessage, 5000);
    }

    private async getLanguageModel(): Promise<any | null> {
        try {
            // Check if the Language Model API is available
            if (!vscode.lm || !vscode.lm.selectChatModels) {
                vscode.window.showErrorMessage('Language Model API is not available. Please update VS Code to version 1.91.0 or later.');
                return null;
            }
            
            // Get all available models first to make a more informed decision
            const allAvailableModels = await vscode.lm.selectChatModels({});
            
            if (allAvailableModels.length === 0) {
                vscode.window.showErrorMessage('No language models are available. Please ensure you have the appropriate extensions installed and authenticated.');
                return null;
            }
            
            // Get the preferred model from configuration
            const config = vscode.workspace.getConfiguration('copilotCodeReview');
            const preferredModel = config.get<string>('preferredModel', 'claude');
            
            // Log available models for debugging
            console.log('Available models:', allAvailableModels.map(m => `${m.name} (${m.vendor})`).join(', '));
            
            // Check for Claude models among all available models
            if (preferredModel === 'claude') {
                // Look for Claude models in all available models
                const claudeModels = allAvailableModels.filter(model => 
                    model.vendor.toLowerCase() === 'anthropic' || 
                    model.name.toLowerCase().includes('claude')
                );
                
                if (claudeModels.length > 0) {
                    // If multiple Claude models are available, prefer Sonnet or the latest available
                    const sonnetModel = claudeModels.find(model => 
                        model.name.toLowerCase().includes('sonnet')
                    );
                    
                    return sonnetModel || claudeModels[0];
                }
                
                // If Claude is not available, fall back to user's Copilot model
                vscode.window.showInformationMessage('No Claude models were detected among your available AI models. Falling back to another available model.');
            }
            
            // Try user's configured Copilot model if available
            const copilotModels = allAvailableModels.filter(model =>
                model.vendor.toLowerCase() === 'copilot' || 
                model.name.toLowerCase().includes('gpt')
            );

            if (copilotModels.length > 0) {
                return copilotModels[0];
            }
            
            // If no specific models were found, use the first available model
            return allAvailableModels[0];
        } catch (error) {
            vscode.window.showErrorMessage('Failed to access language models. Please ensure you have the required extensions installed and are authenticated.');
            return null;
        }
    }

    private async sendModelRequest(model: any, prompt: string): Promise<string> {
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
            throw new Error(`Failed to get response from AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

${Object.entries(AIReviewProvider.REVIEW_CATEGORIES)
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
        console.error(`Error ${operation} with AI model:`, error);
        
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Add Claude-specific error message handling
            if (errorMessage.includes('anthropic') || errorMessage.includes('claude')) {
                vscode.window.showErrorMessage(`Claude model error while ${operation}: ${errorMessage}. Please verify that Claude is properly configured and authenticated.`);
                return null;
            }
        }
        
        vscode.window.showErrorMessage(`Failed to ${operation}: ${errorMessage}. Try selecting a different AI model in settings.`);
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
        try {
            // First attempt: Try to find a clean JSON block
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Second attempt: Look for JSON within triple backticks
            const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                return JSON.parse(codeBlockMatch[1]);
            }
            
            return null;
        } catch (error) {
            console.error("Failed to parse JSON from response:", error);
            return null;
        }
    }

    private createReviewResult(commitHash: string, parsed: any): ReviewResult {
        // Clean up any issues to remove backticks from suggested fixes
        const cleanedIssues = (parsed.issues || []).map((issue: ReviewIssue) => {
            if (issue.suggestedFix) {
                // Fix the multiline code blocks with backtick fences
                // We'll keep the content between the fences but remove the fences themselves
                let fixedContent = issue.suggestedFix;
                
                // Special handling for code blocks with language specifiers
                const codeBlockPattern = /```([\w]*)\n([\s\S]*?)\n```/g;
                const matches = fixedContent.match(codeBlockPattern);
                
                if (matches) {
                    // For each code block found
                    matches.forEach(match => {
                        // Extract just the content between the backticks
                        const innerContent = match.replace(/```[\w]*\n/, '').replace(/\n```$/, '');
                        // Replace the entire block with just the inner content
                        fixedContent = fixedContent.replace(match, innerContent);
                    });
                } else {
                    // Fallback for simple cases
                    fixedContent = fixedContent
                        .replace(/^```[\w]*[\s\n]/, '')
                        .replace(/```[\s]*$/, '')
                        .replace(/\n```[\s]*$/, '')
                        .trim();
                }
                
                issue.suggestedFix = fixedContent;
            }
            return issue;
        });
        
        return {
            commitHash,
            summary: parsed.summary || 'Review completed',
            overallRating: parsed.overallRating || 'good',
            issues: cleanedIssues,
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
