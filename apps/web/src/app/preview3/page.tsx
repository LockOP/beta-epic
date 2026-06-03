import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview3InitialState } from "./initial-state";
import { preview3RootConfig } from "./root-config";
import { preview3RefConfigs } from "./sub-configs";

export default function Preview3Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview3RootConfig}
        refConfigs={preview3RefConfigs}
        store={{ sliceName: "studio-preview-3", initialState: preview3InitialState }}
      />
    </GuiProvider>
  );
}

