import type { Meta, StoryObj } from "@storybook/react";
import { MetricCard } from "@/components/MetricCard";

const meta: Meta<typeof MetricCard> = {
  title: "Dashboard/MetricCard",
  component: MetricCard,
  args: {
    label: "System Uptime",
    value: "47d 12h",
    trend: "up",
    change: 1.8
  }
};

export default meta;

type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {};

export const Degraded: Story = {
  args: {
    label: "Avg Latency",
    value: "182 ms",
    trend: "down",
    change: -3.2
  }
};
