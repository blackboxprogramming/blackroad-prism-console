import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
