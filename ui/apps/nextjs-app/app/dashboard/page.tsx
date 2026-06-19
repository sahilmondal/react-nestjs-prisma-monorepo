import { DashboardView } from "@/components/dashboard/dashboardView"
import { RequireAuth } from '@workspace/ui-components';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardView />
    </RequireAuth>
  )
}
