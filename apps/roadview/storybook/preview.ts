import type { Preview } from '@storybook/react';
import '../styles/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'slate',
      values: [
        { name: 'slate', value: '#0f172a' },
        { name: 'light', value: '#f9fafb' }
      ]
    },
    controls: { expanded: true }
  }
};

export default preview;
