export interface ValidateReport {
    total: number;
    valid: number;
    orphan: number;
    scaleViolation: number;
    schemaFail: number;
    parseFail: number;
    failures: {
        line: number;
        recordId?: string;
        reason: string;
    }[];
}
export declare function validateFile(filePath: string): ValidateReport;
//# sourceMappingURL=validate-self-scores.d.ts.map