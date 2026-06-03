import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview2InitialState } from "./initial-state";
import { preview2RootConfig } from "./root-config";
import { preview2RefConfigs } from "./sub-configs";

export default function Preview2Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview2RootConfig}
        refConfigs={preview2RefConfigs}
        store={{ sliceName: "studio-preview-2", initialState: preview2InitialState }}
      />
    </GuiProvider>
  );
}

