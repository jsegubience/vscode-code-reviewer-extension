#!/bin/bash

# Configuration
REPO_OWNER="jsegubience"
REPO_NAME="vscode-code-reviewer-extension"
EXTENSION_NAME="vscode-copilot-code-review"

echo "🔍 Checking for latest release..."

# Get the latest release info
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest")

# Check if we got a valid response
if echo "$LATEST_RELEASE" | grep -q "Not Found"; then
    echo "❌ Error: Repository not found or no releases available"
    exit 1
fi

# Extract tag name and download URL
TAG_NAME=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')
VERSION=$(echo "$TAG_NAME" | sed 's/^v//')

if [ -z "$TAG_NAME" ]; then
    echo "❌ Error: Could not find latest release tag"
    exit 1
fi

echo "📦 Latest version: $TAG_NAME"

# Construct the download URL
DOWNLOAD_URL="https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$TAG_NAME/$EXTENSION_NAME-$VERSION.vsix"

echo "⬇️  Downloading from: $DOWNLOAD_URL"

# Download the extension
TEMP_FILE="/tmp/$EXTENSION_NAME-$VERSION.vsix"
curl -L "$DOWNLOAD_URL" -o "$TEMP_FILE"

# Check if download was successful
if [ ! -f "$TEMP_FILE" ]; then
    echo "❌ Error: Failed to download the extension"
    exit 1
fi

echo "✅ Downloaded successfully"

# Install the extension
echo "🔧 Installing extension..."
code --install-extension "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Extension installed successfully!"
    echo "🔄 Please reload VS Code to activate the extension"
else
    echo "❌ Error: Failed to install extension"
    exit 1
fi

# Clean up
rm "$TEMP_FILE"
echo "🧹 Cleaned up temporary files"
