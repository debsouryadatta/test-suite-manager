import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';

import { TestList } from './TestList';
import { Test, TestSuite } from '../types';
import { mockApi } from './mockApi';
import { toast } from 'react-hot-toast';

function App() {
  const [tests, setTests] = useState<Test[]>([]);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
  const [duplicateTestLoading, setDuplicateTestLoading] = useState<Record<string, boolean>>({});
  const pollIntervals = useRef<Record<string, NodeJS.Timer>>({});
  const pollTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

    // Cleanup function to clear all intervals and timeouts
    const cleanup = () => {
      Object.values(pollIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
      pollIntervals.current = {};
  
      Object.values(pollTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      pollTimeouts.current = {};
  
      setRunningTests({});
      setDuplicateTestLoading({});
    };

  useEffect(() => {
    // Load initial data
    // mockApi.getTests().then(setTests);
    // mockApi.getTestSuites().then(setSuites);
    const fetchTests = async () => {
      let retryCount = 0;
      const maxRetries = 5; // Maximum number of retries
      let currentInterval = 2000; // Initial interval (2 seconds)

      while (retryCount < maxRetries) {
        try {
          toast.loading('Fetching tests...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (localStorage.getItem('tests') !== null) {
            setTests(JSON.parse(localStorage.getItem('tests') || '[]'));
          } else {
            const initialTests = await mockApi.getTests();
            localStorage.setItem('tests', JSON.stringify(initialTests));
            setTests(initialTests);
          }
          if (localStorage.getItem('testSuites') !== null) {
            setSuites(JSON.parse(localStorage.getItem('testSuites') || '[]'));
          } else {
            const initialSuites = await mockApi.getTestSuites();
            localStorage.setItem('testSuites', JSON.stringify(initialSuites));
            setSuites(initialSuites);
          } 
          toast.dismiss();
          return; // If successful, exit the loop
        } catch (error) {
          console.error('Error fetching tests:', error);
          toast.error('Error fetching tests');
          retryCount++;
          currentInterval *= 2; // Exponential backoff
          console.log(`Retrying in ${currentInterval / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, currentInterval));
        } finally {
          toast.dismiss();
        }
      }
      toast.error(`Failed to fetch tests after ${maxRetries} retries`);
    }
    fetchTests();

    // cleanup on unmount
    return () => {
      cleanup();
    }
  }, []);

  const pollTestStatus = useCallback(async (testId: string) => {
    // Clear existing interval
    if (pollIntervals.current[testId]) {
      clearInterval(pollIntervals.current[testId]);
    }

    let retryCount = 0;
    const maxRetries = 5; // Maximum number of retries
    let currentInterval = 2000; // Initial interval (2 seconds)

    const poll = async () => {
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
          clearTimeout(pollTimeouts.current[testId]);
          delete pollTimeouts.current[testId];
          setRunningTests(prev => ({ ...prev, [testId]: false }));
          toast.success(`Test ${testId} completed`);
        } else {
          toast.success(`Polling for Test ${testId}, status: ${updatedTest.status}`);
          // Reset retryCount and interval
          retryCount = 0;
          currentInterval = 2000;
          clearInterval(pollIntervals.current[testId]);
          pollIntervals.current[testId] = setInterval(poll, currentInterval);
        }
      } catch (error) {
        console.error(`Error polling test status for Test ${testId}:`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          currentInterval *= 2;
          console.log(`Retrying Test ${testId} in ${currentInterval / 1000} seconds...`);
          toast.error(`Error polling test status for Test ${testId}, retry ${retryCount}/${maxRetries}`);
          // Clear the interval and set a new one
          clearInterval(pollIntervals.current[testId]);
          pollIntervals.current[testId] = setInterval(poll, currentInterval);
        } else {
          // Clear the interval and delete it from the map
          clearInterval(pollIntervals.current[testId]);
          delete pollIntervals.current[testId];
          clearTimeout(pollTimeouts.current[testId]);
          delete pollTimeouts.current[testId];
          setRunningTests(prev => ({ ...prev, [testId]: false }));
          toast.error(`Error polling test status for Test ${testId}, after ${maxRetries} retries`);
        }
      }
    };

    // Start initial polling
    pollIntervals.current[testId] = setInterval(poll, currentInterval);
  }, []);

  const handleRunTest = async (testId: string) => {
    setRunningTests(prev => ({ ...prev, [testId]: true }));
    
    try {
      toast.success(`Test ${testId} running`);
      await mockApi.runTest(testId);
      pollTestStatus(testId);
      // Poll timeout
      pollTimeouts.current[testId] = setTimeout(() => {
        clearInterval(pollIntervals.current[testId]);
        delete pollIntervals.current[testId];
        delete pollTimeouts.current[testId];
        setRunningTests(prev => ({ ...prev, [testId]: false }));
        toast.error(`Test ${testId} timed out`);
      }, 30000);
    } catch (error) {
      console.error(`Error running test ${testId}:`, error);
      setRunningTests(prev => ({ ...prev, [testId]: false }));
      toast.error(`Error running test ${testId}`);
      // Clear poll timeout and poll interval if there's an error
      if (pollTimeouts.current[testId]) {
        clearTimeout(pollTimeouts.current[testId]);
        delete pollTimeouts.current[testId];
      }
      if (pollIntervals.current[testId]) {
        clearInterval(pollIntervals.current[testId]);
        delete pollIntervals.current[testId];
      }
    }
  };

  // TODO: Implement duplicate test functionality
  const onDuplicateTest = async (test: Test) => {
    try {
      setDuplicateTestLoading(prev => ({ ...prev, [test.id]: true }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedTest = { ...test, id: Date.now().toString(), name: `${test.name} (Copy)`, created_at: new Date().toISOString() };
      setTests(prev => [...prev, updatedTest]);
      localStorage.setItem('tests', JSON.stringify([...tests, updatedTest])); 
      toast.success(`Test ${test.id} duplicated`);
    } catch (error) {
      console.error(`Error duplicating test ${test.id}:`, error);
      toast.error(`Error duplicating test ${test.id}`);
    } finally {
      setDuplicateTestLoading(prev => ({ ...prev, [test.id]: false }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test Suite Manager
      </Typography>
      
      <TestList
        tests={tests}
        onRunTest={handleRunTest}
        runningTests={runningTests}
        onDuplicateTest={onDuplicateTest}
        duplicateTestLoading={duplicateTestLoading}
      />
    </Container>
  );
}

export default App;