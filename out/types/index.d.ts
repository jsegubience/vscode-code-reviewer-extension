export interface Commit {
    hash: string;
    author: string;
    date: Date;
    message: string;
    diff: string;
    files: string[];
}
export interface ReviewResult {
    commitHash: string;
    summary: string;
    issues: ReviewIssue[];
    suggestions: string[];
    overallRating: 'good' | 'needs-improvement' | 'major-issues';
}
export interface ReviewIssue {
    severity: 'low' | 'medium' | 'high';
    type: 'bug' | 'security' | 'performance' | 'style' | 'maintainability';
    description: string;
    suggestedFix?: string;
    file?: string;
    line?: number;
}
//# sourceMappingURL=index.d.ts.map