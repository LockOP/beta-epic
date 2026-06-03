import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview1InitialState } from "./initial-state";
import { preview1RootConfig } from "./root-config";
import { preview1RefConfigs } from "./sub-configs";

export default function Preview1Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview1RootConfig}
        refConfigs={preview1RefConfigs}
        store={{ sliceName: "studio-preview-1", initialState: preview1InitialState }}
      />
    </GuiProvider>
  );
}

