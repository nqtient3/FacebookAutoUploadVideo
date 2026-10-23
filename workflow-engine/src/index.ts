import { WorkflowRunner } from './engine/workflow-runner';
import { exampleWorkflow } from './workflows/example-workflow';

async function main() {
    const runner = new WorkflowRunner();
    
    try {
        const result = await runner.runWorkflow(exampleWorkflow);
        console.log('Workflow executed successfully:', result);
    } catch (error) {
        console.error('Error executing workflow:', error);
    }
}

main();