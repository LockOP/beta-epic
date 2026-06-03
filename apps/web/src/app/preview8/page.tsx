import { GuiComponent, GuiProvider } from "@beta-epic/ui";
import { preview8InitialState } from "./initial-state";
import { preview8RootConfig } from "./root-config";

export default function Preview8Page() {
  return (
    <GuiProvider>
      <GuiComponent
        rootConfig={preview8RootConfig}
        store={{ sliceName: "studio-preview-8", initialState: preview8InitialState }}
      />
    </GuiProvider>
  );
}

