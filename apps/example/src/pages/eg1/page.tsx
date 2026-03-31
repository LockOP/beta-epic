import { GuiComponent } from "@beta-epic/ui";
import { eg1InitialState } from "./initial-state";
import { eg1RootConfig } from "./root-config";
import { eg1RefConfigs } from "./sub-configs";

export function Eg1Page() {
  return (
    <GuiComponent
      rootConfig={eg1RootConfig}
      refConfigs={eg1RefConfigs}
      store={{ sliceName: "example-eg1", initialState: eg1InitialState }}
    />
  );
}
