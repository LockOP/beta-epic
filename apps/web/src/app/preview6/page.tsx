import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview6InitialState } from "./initial-state";
import { preview6RootConfig } from "./root-config";

export default function Preview6Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview6RootConfig}
        store={{ sliceName: "studio-preview-6", initialState: preview6InitialState }}
      />
    </GuiProvider>
  );
}

