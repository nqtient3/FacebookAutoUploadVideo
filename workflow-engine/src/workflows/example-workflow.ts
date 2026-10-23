import { Workflow } from '../engine/workflow-types';

export const exampleWorkflow: Workflow = {
    id: 'example-workflow',
    steps: [
        {
            name: 'step1',
            type: 'action',
            action: async (input) => {
                // Example action logic
                return { result: 'Step 1 completed', input };
            }
        },
        {
            name: 'step2',
            type: 'action',
            action: async (input) => {
                // Example action logic
                return { result: 'Step 2 completed', input };
            }
        }
    ],
    onComplete: async (results) => {
        // Logic to execute on workflow completion
        console.log('Workflow completed with results:', results);
    }
};