import { GuiComponent } from "@beta-epic/ui";
import { eg4InitialState } from "./initial-state";
import { eg4RootConfig } from "./root-config";
import { eg4RefConfigs } from "./sub-configs";

export function Eg4Page() {
  return (
    <GuiComponent
      rootConfig={eg4RootConfig}
      refConfigs={eg4RefConfigs}
      store={{ sliceName: "example-eg4", initialState: eg4InitialState }}
    />
  );
}
