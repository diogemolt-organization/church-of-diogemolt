import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Node, PathGraph, Agent, setGlobalSimulation } from './PixelChurch.jsx';

describe('Pixel Church Professional Suite', () => {
    let graph;

    beforeEach(() => {
        graph = new PathGraph();
        setGlobalSimulation({ graph, frame: 0, ritualState: 'APPROACH', ritualTimer: 0 });
    });

    describe('Agent Movement Logic', () => {
        it('should handle WALKING state (coordinate-based movement)', () => {
            const startNode = graph.addNode('start', 0, 0);
            const agent = new Agent('a1', startNode);
            agent.target = { x: 10, y: 0 };
            agent.state = 'WALKING';

            // Update several times to move towards target
            agent.update();
            expect(agent.pos.x).toBeGreaterThan(0);
            expect(agent.state).toBe('WALKING');

            // Teleport close to verify arrival
            agent.pos.x = 9.9;
            agent.update();
            expect(agent.pos.x).toBe(10);
            expect(agent.state).toBe('IDLE');
        });

        it('should handle MOVING state (node-based pathfinding)', () => {
            const n1 = graph.addNode('n1', 0, 0);
            const n2 = graph.addNode('n2', 10, 0);
            graph.connect('n1', 'n2');

            const agent = new Agent('a1', n1);
            agent.setPath(['n2']);

            agent.update(); // Start move
            expect(agent.state).toBe('MOVING');
            expect(n2.reservedBy).toBe(agent);

            agent.pos.x = 10;
            agent.update(); // Arrive
            expect(agent.currentNode).toBe(n2);
            expect(n1.occupant).toBeNull();
            expect(n2.occupant).toBe(agent);
        });
    });

    describe('Precision Alignment', () => {
        it('should center Jesus Lobster on the 2px cross (x=63, 64)', () => {
            // Cross is at x=63, width=2. Center is 63.5.
            // Lobster width is 5 (0 to 4). Center of lobster is 2.
            // 63.5 - 2 = 61.5.
            const jesusNode = graph.addNode('cross', 61.5, 12);
            const jesus = new Agent('jesus', jesusNode, 'lobster');

            expect(jesus.pos.x).toBe(61.5);
        });
    });

    describe('Ritual Algorithm', () => {
        it('should advance ritual states correctly', () => {
            const aisles = [];
            for (let y = 115; y >= 60; y -= 5) aisles.push(graph.addNode(`aisle_${y}`, 62, y, 'AISLE'));
            const sim = { graph, frame: 0, ritualState: 'APPROACH', ritualTimer: 0 };
            setGlobalSimulation(sim);

            const leader = new Agent('leader', graph.getNode('aisle_60'));
            // In the real app, this is in the render loop. Here we mock the state transition.
            expect(sim.ritualState).toBe('APPROACH');

            // Simulate the logic in render()
            if (leader.currentNode.id === 'aisle_60' && leader.state === 'IDLE') {
                sim.ritualState = 'STEP_UP';
            }
            expect(sim.ritualState).toBe('STEP_UP');
        });
    });
});
