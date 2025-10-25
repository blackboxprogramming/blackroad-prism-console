import type { Meta, StoryObj } from "@storybook/react";
import { ShortcutGrid } from "@/components/ShortcutGrid";
import dashboard from "@/mocks/dashboard.json";

const meta: Meta<typeof ShortcutGrid> = {
  title: "Runbooks/ShortcutGrid",
  component: ShortcutGrid,
  args: {
    shortcuts: dashboard.shortcuts
  }
};

export default meta;

type Story = StoryObj<typeof ShortcutGrid>;

export const Default: Story = {};
