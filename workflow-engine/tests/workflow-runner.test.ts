import { WorkflowRunner } from '../src/engine/workflow-runner';
import { exampleWorkflow } from '../src/workflows/example-workflow';
import { Result } from '../src/engine/workflow-types';

describe('WorkflowRunner', () => {
    let workflowRunner: WorkflowRunner;

    beforeEach(() => {
        workflowRunner = new WorkflowRunner();
    });

    test('should execute the example workflow and return the expected result', async () => {
        const result: Result = await workflowRunner.runWorkflow(exampleWorkflow);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        // Add more assertions based on the expected result structure
    });

    test('should handle errors in the workflow execution', async () => {
        const faultyWorkflow = { ...exampleWorkflow, steps: [{ name: 'faultyStep' }] }; // Example of a faulty workflow
        const result: Result = await workflowRunner.runWorkflow(faultyWorkflow);
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});