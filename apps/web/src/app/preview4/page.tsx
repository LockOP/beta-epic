import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview4InitialState } from "./initial-state";
import { preview4RootConfig } from "./root-config";
import { preview4RefConfigs } from "./sub-configs";

export default function Preview4Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview4RootConfig}
        refConfigs={preview4RefConfigs}
        store={{ sliceName: "studio-preview-4", initialState: preview4InitialState }}
      />
    </GuiProvider>
  );
}

