import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview5InitialState } from "./initial-state";
import { preview5RootConfig } from "./root-config";

export default function Preview5Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview5RootConfig}
        store={{ sliceName: "studio-preview-5", initialState: preview5InitialState }}
      />
    </GuiProvider>
  );
}

