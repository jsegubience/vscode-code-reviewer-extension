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
exports.CopilotProvider = void 0;
const vscode = __importStar(require("vscode"));
class CopilotProvider {
    async reviewCommit(commit) {
        try {
            // Create a comprehensive prompt for Copilot
            const prompt = this.createReviewPrompt(commit);
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
        }
        catch (error) {
            console.error('Error reviewing commit with Copilot:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to review commit: ${errorMessage}`);
            return null;
        }
    }
    createReviewPrompt(commit) {
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
    parseReviewResponse(commitHash, response) {
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
        }
        catch (error) {
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
exports.CopilotProvider = CopilotProvider;
//# sourceMappingURL=copilotProvider.js.map