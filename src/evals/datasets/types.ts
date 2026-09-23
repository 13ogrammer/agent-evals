import type { TrajectoryExpectation } from '../checks/trajectory.js';

export interface TestCase {
  id: string;
  input: string;
  expectedTrajectory: TrajectoryExpectation;
  requiredAnswerContains: (string | string[])[];
}