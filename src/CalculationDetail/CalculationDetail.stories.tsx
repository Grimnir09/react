import type { Decorator, Meta, StoryObj } from "@storybook/react";
import React from "react";

import { fullFit } from "../../.storybook/fits";

import { DogmaEngineProvider } from "../DogmaEngineProvider";
import { EsiProvider } from "../EsiProvider";
import { EveDataProvider } from "../EveDataProvider";
import { ShipSnapshotProvider } from "../ShipSnapshotProvider";
import { CalculationDetail } from "./";

const meta: Meta<typeof CalculationDetail> = {
  component: CalculationDetail,
  tags: ["autodocs"],
  title: "Component/CalculationDetail",
};

export default meta;
type Story = StoryObj<typeof CalculationDetail>;

const useShipSnapshotProvider: Decorator<{
  source: "Ship" | "Char" | "Structure" | "Target" | { Item?: number; Cargo?: number };
}> = (Story, context) => {
  return (
    <EveDataProvider>
      <DogmaEngineProvider>
        <ShipSnapshotProvider {...context.parameters.snapshot}>
          <EsiProvider>
            <Story {...context.args} />
          </EsiProvider>
        </ShipSnapshotProvider>
      </DogmaEngineProvider>
    </EveDataProvider>
  );
};

export const Default: Story = {
  args: {
    source: "Ship",
  },
  decorators: [useShipSnapshotProvider],
  parameters: {
    snapshot: {
      initialFit: fullFit,
    },
  },
};
