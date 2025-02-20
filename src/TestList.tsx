import React, { useState } from 'react';
import { Test } from '../types';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  Collapse,
  CircularProgress
} from '@mui/material';

interface TestListProps {
  tests: Test[];
  onRunTest: (testId: string) => void;
  onDuplicateTest?: (test: Test) => void;
  runningTests: Record<string, boolean>;
}

export const TestList: React.FC<TestListProps> = ({ 
  tests, 
  onRunTest, 
  onDuplicateTest,
  runningTests 
}) => {
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  const toggleExpand = (testId: string) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  return (
    <Stack spacing={2}>
      {tests.map(test => (
        <Card key={test.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography 
                variant="h6" 
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleExpand(test.id)}
              >
                {test.name}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => onRunTest(test.id)}
                  disabled={runningTests[test.id]}
                >
                  {runningTests[test.id] ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Run Test'
                  )}
                </Button>
                {/* TODO: Implement duplicate functionality */}
              </Stack>
            </Stack>
            
            <Collapse in={expandedTests[test.id]}>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {test.description}
              </Typography>
              {test.lastRun && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Last run: {new Date(test.lastRun.startedAt).toLocaleString()}
                  {test.lastRun.results && (
                    <span>
                      ({test.lastRun.results.passed} passed, 
                      {test.lastRun.results.failed} failed)
                    </span>
                  )}
                </Typography>
              )}
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};