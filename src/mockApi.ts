import { Test, TestSuite } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockTests: Test[] = [
  {
    id: '1',
    name: 'Login Flow Test',
    description: 'Validates the user login flow',
    suiteId: '1',
    status: 'idle',
    created_at: '2022-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Payment Processing',
    description: 'Tests payment processing workflow',
    suiteId: '1',
    status: 'idle',
    created_at: '2022-01-01T00:00:00.000Z',
  },
];

const mockSuites: TestSuite[] = [
  {
    id: '1',
    name: 'Core Functionality',
    description: 'Core application tests',
  },
];

export const mockApi = {
  async getTests(): Promise<Test[]> {
    await delay(500);
    return [...mockTests];
  },

  async getTestSuites(): Promise<TestSuite[]> {
    await delay(500);
    return [...mockSuites];
  },

  async runTest(testId: string): Promise<void> {
    await delay(1000);
    const test = mockTests.find(t => t.id === testId);
    if (test) {
      test.status = 'running';
      test.lastRun = {
        startedAt: new Date().toISOString(),
        status: 'running',
      };
    }
  },

  async getTestStatus(testId: string): Promise<Test> {
    await delay(500);
    const test = mockTests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    // Simulate test completion after a few polls
    if (test.status === 'running') {
      const random = Math.random();
      if (random > 0.7) {
        test.status = 'completed';
        test.lastRun = {
          ...test.lastRun!,
          status: 'completed',
          completedAt: new Date().toISOString(),
          results: {
            passed: Math.floor(Math.random() * 10),
            failed: Math.floor(Math.random() * 3),
          },
        };
      }
    }

    return { ...test };
  },
};