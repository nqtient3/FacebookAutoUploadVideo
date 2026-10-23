# Workflow Engine

This project is a simple workflow engine built with TypeScript. It allows users to define workflows and execute them through a structured process.

## Project Structure

```
workflow-engine
├── src
│   ├── index.ts                # Entry point of the workflow engine
│   ├── engine
│   │   ├── workflow-runner.ts   # Contains the WorkflowRunner class
│   │   └── workflow-types.ts     # Defines types and interfaces for workflows
│   ├── steps
│   │   └── step-registry.ts      # Manages registration and retrieval of workflow steps
│   └── workflows
│       └── example-workflow.ts   # Example workflow definition
├── tests
│   └── workflow-runner.test.ts    # Unit tests for the WorkflowRunner class
├── package.json                   # npm configuration file
├── tsconfig.json                  # TypeScript configuration file
└── README.md                      # Project documentation
```

## Installation

To install the project dependencies, run:

```
npm install
```

## Usage

To run the workflow engine, execute the following command:

```
npm start
```

You can define your own workflows in the `src/workflows` directory and register steps in the `src/steps/step-registry.ts` file.

## Running Tests

To run the unit tests, use:

```
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.