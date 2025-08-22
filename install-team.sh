#!/bin/bash

# Team Installation Script for VSCode Copilot Code Review Extension

echo "🚀 Installing VSCode Copilot Code Review Extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js first."
    exit 1
fi

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code is required. Please install VS Code first."
    exit 1
fi

# Clone or update repository
if [ -d "vscode-copilot-code-review" ]; then
    echo "📂 Updating existing repository..."
    cd vscode-copilot-code-review
    git pull
else
    echo "📥 Cloning repository..."
    git clone [YOUR_REPO_URL] vscode-copilot-code-review
    cd vscode-copilot-code-review
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile the extension
echo "🔨 Compiling extension..."
npm run compile

# Package the extension
echo "📦 Packaging extension..."
npx @vscode/vsce package

# Install in VS Code
echo "🔧 Installing in VS Code..."
VSIX_FILE=$(ls *.vsix | head -n 1)
if [ -n "$VSIX_FILE" ]; then
    code --install-extension "$VSIX_FILE"
    echo "✅ Extension installed successfully!"
    echo "💡 Use Ctrl+Alt+J to review latest commit or Ctrl+Alt+K for specific commit"
    echo "💡 Make sure GitHub Copilot is installed and authenticated"
else
    echo "❌ Failed to create VSIX package"
    exit 1
fi
