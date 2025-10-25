import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { expanded: true }
  }
};

export default preview;
