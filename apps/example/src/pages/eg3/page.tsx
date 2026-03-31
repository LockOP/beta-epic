import { GuiComponent } from "@beta-epic/ui";
import { eg3InitialState } from "./initial-state";
import { eg3RootConfig } from "./root-config";

export function Eg3Page() {
  return (
    <GuiComponent
      rootConfig={eg3RootConfig}
      store={{ sliceName: "example-eg3", initialState: eg3InitialState }}
    />
  );
}
