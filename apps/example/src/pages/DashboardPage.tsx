import { GuiComponent } from "@beta-epic/ui";
import {
  dashboardConfig,
  dashboardInitialState,
  dashboardRefConfigs,
} from "@/configs/dashboard";

export function DashboardPage() {
  return (
    <GuiComponent
      rootConfig={dashboardConfig}
      refConfigs={dashboardRefConfigs}
      store={{ sliceName: "example-dashboard", initialState: dashboardInitialState }}
    />
  );
}
