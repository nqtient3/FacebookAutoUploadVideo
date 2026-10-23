import { Workflow, Result } from './workflow-types';

export class WorkflowRunner {
    async runWorkflow(workflow: Workflow, initialInput: any = {}): Promise<Result> {
        try {
            if (!workflow || !Array.isArray(workflow.steps)) {
                return {
                    success: false,
                    error: 'Workflow is missing or steps is not an array'
                };
            }

            let currentData = initialInput;
            const executionResults: Record<string, any> = {};

            for (const step of workflow.steps) {
                const handler = step.execute || step.action;
                if (typeof handler !== 'function') {
                    return {
                        success: false,
                        error: `Step "${step.name}" has no execute or action function.`
                    };
                }

                currentData = await handler(currentData);
                executionResults[step.name] = currentData;
            }

            if (typeof workflow.onComplete === 'function') {
                await workflow.onComplete(executionResults);
            }

            if (typeof workflow.onCleanup === 'function') {
                try {
                    await workflow.onCleanup(executionResults);
                } catch (cleanupErr: any) {
                    console.warn(`[WorkflowRunner] onCleanup warning: ${cleanupErr?.message}`);
                }
            }

            return {
                success: true,
                data: executionResults
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || 'Workflow execution failed with unknown error'
            };
        }
    }
}

export default WorkflowRunner;