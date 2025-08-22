import { Commit, ReviewResult } from '../types';
export declare class CopilotProvider {
    reviewCommit(commit: Commit): Promise<ReviewResult | null>;
    private createReviewPrompt;
    private parseReviewResponse;
}
//# sourceMappingURL=copilotProvider.d.ts.map