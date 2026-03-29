import { GuiComponent } from "@beta-epic/ui";
import {
  searchConfig,
  searchInitialState,
} from "@/configs/search";

export function SearchPage() {
  return (
    <GuiComponent
      rootConfig={searchConfig}
      store={{ sliceName: "example-3-search", initialState: searchInitialState }}
    />
  );
}
