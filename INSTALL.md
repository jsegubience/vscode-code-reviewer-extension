# Installation Instructions for Team

## Prerequisites
- VS Code 1.90.0 or higher
- GitHub Copilot subscription and extension
- Node.js and npm installed

## Installation from Source

1. **Clone the repository:**
   ```bash
   git clone git@gitlab-ssh.actech.cambridge.org:JC/vscode-copilot-code-reviewer-extension.git
   cd vscode-copilot-code-reviewer-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the extension:**
   ```bash
   npm run compile
   ```

4. **Package the extension:**
   ```bash
   npx @vscode/vsce package
   ```

5. **Install in VS Code:**
   ```bash
   code --install-extension vscode-copilot-code-review-0.1.0.vsix
   ```

## Quick Installation from VSIX

If you just received the `.vsix` file:

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Install from VSIX..."
4. Select the `.vsix` file
5. Reload VS Code when prompted

## Usage

- **Review Latest Commit:** `Ctrl+Alt+J`
- **Review Specific Commit:** `Ctrl+Alt+K`
- Or use Command Palette: "Review Latest Commit with Copilot"

## Troubleshooting

- Ensure GitHub Copilot is installed and authenticated
- Make sure you're in a Git repository
- Check that the repository has at least one commit
