import { GuiComponent } from "@beta-epic/ui";
import {
  subjectsConfig,
  subjectsInitialState,
} from "@/configs/subjects";

export function SubjectsPage() {
  return (
    <GuiComponent
      rootConfig={subjectsConfig}
      store={{ sliceName: "example-2-subjects", initialState: subjectsInitialState }}
    />
  );
}
