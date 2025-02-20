import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';

import { TestList } from './TestList';
import { Test, TestSuite } from '../types';
import { mockApi } from './mockApi';

function App() {
  const [tests, setTests] = useState<Test[]>([]);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
  const pollIntervals = useRef<Record<string, NodeJS.Timer>>({});

  useEffect(() => {
    // Load initial data
    mockApi.getTests().then(setTests);
    mockApi.getTestSuites().then(setSuites);
  }, []);

  const pollTestStatus = useCallback(async (testId: string) => {
    // Clear existing interval
    if (pollIntervals.current[testId]) {
      clearInterval(pollIntervals.current[testId]);
    }

    const interval = setInterval(async () => {
      try {
        const updatedTest = await mockApi.getTestStatus(testId);
        
        setTests(prevTests =>
          prevTests.map(test =>
            test.id === testId ? updatedTest : test
          )
        );

        if (['completed', 'failed'].includes(updatedTest.status)) {
          clearInterval(pollIntervals.current[testId]);
          delete pollIntervals.current[testId];
          setRunningTests(prev => ({ ...prev, [testId]: false }));
        }
      } catch (error) {
        console.error('Error polling test status:', error);
        clearInterval(pollIntervals.current[testId]);
        delete pollIntervals.current[testId];
        setRunningTests(prev => ({ ...prev, [testId]: false }));
      }
    }, 2000); // Poll every 2 seconds for demo purposes

    pollIntervals.current[testId] = interval;
  }, []);

  const handleRunTest = async (testId: string) => {
    setRunningTests(prev => ({ ...prev, [testId]: true }));
    
    try {
      await mockApi.runTest(testId);
      pollTestStatus(testId);
    } catch (error) {
      console.error('Error running test:', error);
      setRunningTests(prev => ({ ...prev, [testId]: false }));
    }
  };

  // TODO: Implement duplicate test functionality

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test Suite Manager
      </Typography>
      
      <TestList
        tests={tests}
        onRunTest={handleRunTest}
        runningTests={runningTests}
      />
    </Container>
  );
}

export default App;