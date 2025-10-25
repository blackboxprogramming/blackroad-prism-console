import type { Meta, StoryObj } from "@storybook/react";
import { AgentTable } from "@/components/AgentTable";
import agentsJson from "@/mocks/agents.json";
import type { AgentRecord } from "@/types/dashboard";

const agents = agentsJson as AgentRecord[];

const meta: Meta<typeof AgentTable> = {
  title: "Agents/AgentTable",
  component: AgentTable,
  args: {
    agents
  }
};

export default meta;

type Story = StoryObj<typeof AgentTable>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    agents: [],
    isLoading: true
  }
};
