import type { Decorator, Meta, StoryObj } from "@storybook/react";
import React from "react";

import { fullFit } from "../../.storybook/fits";

import { HullListing } from "./";
import { DogmaEngineProvider } from "../DogmaEngineProvider";
import { EsiProvider } from "../EsiProvider";
import { EveDataProvider } from "../EveDataProvider";
import { LocalFitProvider } from "../LocalFitProvider";
import { ShipSnapshotProvider } from "../ShipSnapshotProvider";

const meta: Meta<typeof HullListing> = {
  component: HullListing,
  tags: ["autodocs"],
  title: "Component/HullListing",
};

export default meta;
type Story = StoryObj<typeof HullListing>;

const withEsiProvider: Decorator<Record<string, never>> = (Story, context) => {
  return (
    <EveDataProvider>
      <DogmaEngineProvider>
        <ShipSnapshotProvider {...context.parameters.snapshot}>
          <LocalFitProvider>
            <EsiProvider>
              <div style={{ height: "400px" }}>
                <Story />
              </div>
            </EsiProvider>
          </LocalFitProvider>
        </ShipSnapshotProvider>
      </DogmaEngineProvider>
    </EveDataProvider>
  );
};

export const Default: Story = {
  args: {},
  decorators: [withEsiProvider],
  parameters: {
    snapshot: {
      initialFit: fullFit,
    },
  },
};
