# Council Mode Specification

## Goal
Enable a new council concept where multiple specialist agents discuss a user topic, critique one another, and a central authority consolidates the best final answer.

## User problem
Single-agent answers can miss risks, bias toward one frame, or skip execution details. Users need a stronger decision surface that combines strategy, critique, and action.

## Core workflow
1. User creates a council with multiple expert roles.
2. User opens chat with that council.
3. Each expert contributes a distinct view and challenges weak reasoning.
4. A central authority produces the final consolidated response.

## MVP scope
- Council creation inside the existing agent builder
- Configurable expert members
- Multi-round internal debate
- Final authority synthesis in chat
- Optional use of existing tools during synthesis

## Output requirements
The final answer should include:
- Council consensus
- Key risks and disagreements
- Recommended actions

## Safety and quality
- Validate council configuration with runtime schemas
- Require at least two experts for council mode
- Keep expert prompts concise and role-specific
- Treat the final synthesis as authoritative but still explain uncertainty and risk

## Extension ideas
- Member-specific models
- Voting or confidence scoring
- Structured decision logs
- Save reusable council templates
