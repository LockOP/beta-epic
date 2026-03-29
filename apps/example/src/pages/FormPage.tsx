import { GuiComponent } from "@beta-epic/ui";
import { formConfig, formInitialState } from "@/configs/form";

export function FormPage() {
  return (
    <GuiComponent
      rootConfig={formConfig}
      store={{ sliceName: "example-form", initialState: formInitialState }}
    />
  );
}
