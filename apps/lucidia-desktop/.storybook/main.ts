import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/ui/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-links', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  }
};

export default config;
