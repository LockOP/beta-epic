import { GuiComponent } from "@beta-epic/ui";
import { eg2InitialState } from "./initial-state";
import { eg2RootConfig } from "./root-config";

export function Eg2Page() {
  return (
    <GuiComponent
      rootConfig={eg2RootConfig}
      store={{ sliceName: "example-eg2", initialState: eg2InitialState }}
    />
  );
}
