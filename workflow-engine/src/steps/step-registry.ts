import { Step } from '../engine/workflow-types';

class StepRegistry {
    private steps: Map<string, Step> = new Map();

    registerStep(step: Step): void {
        this.steps.set(step.name, step);
    }

    getStep(stepName: string): Step {
        const step = this.steps.get(stepName);
        if (!step) {
            throw new Error(`Step "${stepName}" not found.`);
        }
        return step;
    }
}

export default StepRegistry;