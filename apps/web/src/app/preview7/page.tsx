import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview7InitialState } from "./initial-state";
import { preview7RootConfig } from "./root-config";

export default function Preview7Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview7RootConfig}
        store={{ sliceName: "studio-preview-7", initialState: preview7InitialState }}
      />
    </GuiProvider>
  );
}

