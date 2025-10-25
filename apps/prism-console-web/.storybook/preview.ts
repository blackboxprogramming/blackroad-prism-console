import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'console',
      values: [{ name: 'console', value: '#0b0d17' }]
    }
  }
};

export default preview;
