import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview9InitialState } from "./initial-state";
import { preview9RootConfig } from "./root-config";

export default function Preview9Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview9RootConfig}
        store={{ sliceName: "studio-preview-9", initialState: preview9InitialState }}
      />
    </GuiProvider>
  );
}

