export interface Step {
    name: string;
    type?: string;
    execute?: (input: any) => Promise<any>;
    action?: (input: any) => Promise<any>;
}

export interface Workflow {
    id?: string;
    name?: string;
    steps: Step[];
    onComplete?: (results: any) => Promise<void> | void;
    onCleanup?: (results: any) => Promise<void> | void;
}

export interface Result {
    success: boolean;
    data?: any;
    error?: string;
}