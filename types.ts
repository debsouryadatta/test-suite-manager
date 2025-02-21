export interface Test {
  id: string;
  name: string;
  description: string;
  suiteId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  created_at: string;
  lastRun?: {
    startedAt: string;
    completedAt?: string;
    status: 'running' | 'completed' | 'failed';
    results?: {
      passed: number;
      failed: number;
    };
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
}