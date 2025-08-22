# VSCode Copilot Code Review Extension

An intelligent VS Code extension that leverages GitHub Copilot to perform automated code reviews on Git commits. Get instant feedback on your code changes with AI-powered analysis covering code quality, security, performance, and best practices.

## Features

✨ **AI-Powered Reviews**: Uses GitHub Copilot to analyze your code changes
🔍 **Comprehensive Analysis**: Covers code quality, security, performance, and maintainability
⚡ **Instant Feedback**: Get reviews in seconds with simple hotkey commands
📝 **Detailed Reports**: Formatted markdown reports with actionable suggestions
🎯 **Flexible Targeting**: Review latest commit or specify any commit hash

## Prerequisites

- **VS Code 1.90.0 or higher**
- **GitHub Copilot subscription** and extension installed
- **Git repository** in your workspace

## Installation

1. Clone this repository or download the VSIX package
2. Install the extension in VS Code
3. Ensure GitHub Copilot is installed and authenticated

## Usage

### Review Latest Commit
- **Command**: `Review Latest Commit with Copilot`
- **Hotkey**: `Ctrl+Alt+J` (Windows/Linux) or `Cmd+Alt+J` (Mac)
- **Action**: Reviews the most recent commit in your repository

### Review Specific Commit
- **Command**: `Review Specific Commit with Copilot`
- **Hotkey**: `Ctrl+Alt+K` (Windows/Linux) or `Cmd+Alt+K` (Mac)
- **Action**: Prompts for a commit hash and reviews that specific commit

### Using the Commands

1. Open a Git repository in VS Code
2. Use the hotkeys or run commands from the Command Palette (`Ctrl+Shift+P`)
3. Wait for the AI analysis to complete
4. Review the results in the generated markdown document

## What Gets Analyzed

The extension analyzes your commits for:

- **Code Quality**: Best practices, coding standards, and maintainability
- **Potential Bugs**: Logic errors, edge cases, and runtime issues
- **Security**: Vulnerabilities, unsafe operations, and security best practices
- **Performance**: Inefficient algorithms, memory usage, and optimization opportunities
- **Testing**: Missing tests, test coverage recommendations

## Output Format

Reviews are presented in a structured markdown format including:

- **Overall Rating**: Good, Needs Improvement, or Major Issues
- **Summary**: Brief overview of the changes and assessment
- **Issues Found**: Categorized by severity (Low, Medium, High) and type
- **Suggestions**: Actionable recommendations for improvement

## Development

### Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd vscode-copilot-code-review

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch
```

### Testing
1. Press `F5` to launch a new Extension Development Host window
2. Open a Git repository in the new window
3. Test the extension commands

### Project Structure
```
src/
├── extension.ts              # Main extension entry point
├── commands/
│   ├── reviewLatestCommit.ts    # Latest commit review command
│   └── reviewSpecificCommit.ts  # Specific commit review command
├── providers/
│   └── copilotProvider.ts       # GitHub Copilot integration
├── utils/
│   ├── gitUtils.ts             # Git operations and utilities
│   └── reviewUtils.ts          # Review formatting and display
└── types/
    └── index.ts                # TypeScript type definitions
```

## Configuration

The extension works out of the box with GitHub Copilot. Ensure:

1. GitHub Copilot extension is installed
2. You're signed into GitHub Copilot
3. Your workspace contains a Git repository

## Troubleshooting

### "GitHub Copilot is not available"
- Ensure the GitHub Copilot extension is installed and authenticated
- Check your Copilot subscription status
- Restart VS Code and try again

### "Not a Git repository"
- Open a folder that contains a Git repository
- Initialize Git in your project: `git init`

### "No commits found"
- Ensure your repository has at least one commit
- Check that you're in the correct directory

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.