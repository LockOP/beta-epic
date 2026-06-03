import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview10InitialState } from "./initial-state";
import { preview10RootConfig } from "./root-config";

export default function Preview10Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview10RootConfig}
        store={{ sliceName: "studio-preview-10", initialState: preview10InitialState }}
      />
    </GuiProvider>
  );
}

