import { Commit } from '../types';
export declare function getLatestCommit(): Promise<Commit | null>;
export declare function getCommitByHash(commitHash: string): Promise<Commit | null>;
export declare function checkRepositoryStatus(): boolean;
//# sourceMappingURL=gitUtils.d.ts.map